import { InvoiceStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/prisma", () => ({
  default: {
    childProfile: { findFirst: vi.fn() },
    invoice: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from "../../lib/prisma";
import {
  createInvoice,
  getBillingMetrics,
  getInvoices,
  getParentInvoices,
  updateInvoiceStatus,
} from "./invoices.service";

const input = {
  invoiceNumber: "INV-1001",
  amountCents: 12500,
  dueDate: "2026-08-15T00:00:00.000Z",
  childProfileId: "child-1",
  description: "August tuition",
};

describe("invoice service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists only invoices from the authenticated organization", async () => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([]);

    await getInvoices("org-a");

    expect(prisma.invoice.findMany).toHaveBeenCalledWith({
      where: { organizationId: "org-a" },
      include: { childProfile: true },
      orderBy: [{ dueDate: "asc" }, { invoiceNumber: "asc" }],
    });
  });

  it("creates an organization-scoped invoice for an active child", async () => {
    vi.mocked(prisma.childProfile.findFirst).mockResolvedValue({ id: "child-1" });
    vi.mocked(prisma.invoice.create).mockResolvedValue({ id: "invoice-1" } as never);

    await createInvoice("org-a", input);

    expect(prisma.childProfile.findFirst).toHaveBeenCalledWith({
      where: {
        id: "child-1",
        organizationId: "org-a",
        archived: false,
      },
      select: { id: true },
    });
    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-a",
          invoiceNumber: "INV-1001",
          amountCents: 12500,
          status: InvoiceStatus.DRAFT,
        }),
      })
    );
  });

  it("rejects invalid invoice amounts and due dates", async () => {
    await expect(
      createInvoice("org-a", { ...input, amountCents: 0 })
    ).rejects.toThrow("Invoice amount must be a positive number of cents.");
    await expect(
      createInvoice("org-a", { ...input, dueDate: "invalid" })
    ).rejects.toThrow("A valid invoice due date is required.");
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it("rejects a child outside the authenticated organization", async () => {
    vi.mocked(prisma.childProfile.findFirst).mockResolvedValue(null);

    await expect(createInvoice("org-a", input)).rejects.toThrow(
      "Child profile is unavailable for this organization."
    );
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });

  it("does not update an invoice owned by another organization", async () => {
    vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null);

    const result = await updateInvoiceStatus(
      "invoice-1",
      "org-b",
      InvoiceStatus.PAID
    );

    expect(result).toBeNull();
    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it("records paid time when an invoice becomes paid", async () => {
    vi.mocked(prisma.invoice.findFirst).mockResolvedValue({ id: "invoice-1" });
    vi.mocked(prisma.invoice.update).mockResolvedValue({ id: "invoice-1" } as never);

    await updateInvoiceStatus("invoice-1", "org-a", InvoiceStatus.PAID);

    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "invoice-1" },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: expect.any(Date),
        },
      })
    );
  });

  it("returns only non-draft invoices for linked children", async () => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([]);

    await getParentInvoices("parent-1", "org-a");

    expect(prisma.invoice.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: "org-a",
        status: { not: InvoiceStatus.DRAFT },
        childProfile: {
          archived: false,
          parentLinks: { some: { parentId: "parent-1" } },
        },
      },
      include: {
        childProfile: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: [{ dueDate: "asc" }, { invoiceNumber: "asc" }],
    });
  });

  it("summarizes paid, outstanding, and overdue billing metrics", async () => {
    vi.mocked(prisma.invoice.findMany).mockResolvedValue([
      { amountCents: 10000, status: InvoiceStatus.PAID },
      { amountCents: 12500, status: InvoiceStatus.SENT },
      { amountCents: 9000, status: InvoiceStatus.OVERDUE },
    ] as never);

    await expect(getBillingMetrics("org-a")).resolves.toEqual({
      invoiceCount: 3,
      paidCents: 10000,
      outstandingCents: 21500,
      overdueCount: 1,
    });
  });
});
