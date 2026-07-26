import { InvoiceStatus } from "@prisma/client";
import prisma from "../../lib/prisma";

export type CreateInvoiceInput = {
  invoiceNumber: string;
  amountCents: number;
  dueDate: string;
  childProfileId: string;
  description?: string;
  status?: InvoiceStatus;
};

const editableStatuses = new Set<InvoiceStatus>([
  InvoiceStatus.DRAFT,
  InvoiceStatus.SENT,
  InvoiceStatus.PAID,
  InvoiceStatus.OVERDUE,
  InvoiceStatus.VOID,
]);

function validateInvoiceInput(input: CreateInvoiceInput) {
  const invoiceNumber = input.invoiceNumber?.trim();
  const dueDate = new Date(input.dueDate);

  if (!invoiceNumber || !input.childProfileId) {
    throw new Error("Invoice number and child profile are required.");
  }
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error("Invoice amount must be a positive number of cents.");
  }
  if (Number.isNaN(dueDate.getTime())) {
    throw new Error("A valid invoice due date is required.");
  }
  if (input.status && !editableStatuses.has(input.status)) {
    throw new Error("Invoice status is invalid.");
  }

  return { invoiceNumber, dueDate };
}

async function validateChildProfile(
  organizationId: string,
  childProfileId: string
) {
  const child = await prisma.childProfile.findFirst({
    where: {
      id: childProfileId,
      organizationId,
      archived: false,
    },
    select: { id: true },
  });

  if (!child) {
    throw new Error("Child profile is unavailable for this organization.");
  }
}

export async function getInvoices(organizationId: string) {
  return prisma.invoice.findMany({
    where: { organizationId },
    include: { childProfile: true },
    orderBy: [{ dueDate: "asc" }, { invoiceNumber: "asc" }],
  });
}

export async function createInvoice(
  organizationId: string,
  input: CreateInvoiceInput
) {
  const { invoiceNumber, dueDate } = validateInvoiceInput(input);
  await validateChildProfile(organizationId, input.childProfileId);

  return prisma.invoice.create({
    data: {
      organizationId,
      invoiceNumber,
      amountCents: input.amountCents,
      dueDate,
      childProfileId: input.childProfileId,
      description: input.description?.trim() || undefined,
      status: input.status ?? InvoiceStatus.DRAFT,
    },
    include: { childProfile: true },
  });
}

export async function updateInvoiceStatus(
  id: string,
  organizationId: string,
  status: InvoiceStatus
) {
  if (!editableStatuses.has(status)) {
    throw new Error("Invoice status is invalid.");
  }

  const existing = await prisma.invoice.findFirst({
    where: { id, organizationId },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.invoice.update({
    where: { id },
    data: {
      status,
      paidAt: status === InvoiceStatus.PAID ? new Date() : null,
    },
    include: { childProfile: true },
  });
}

export async function getParentInvoices(
  parentId: string,
  organizationId: string
) {
  return prisma.invoice.findMany({
    where: {
      organizationId,
      status: { not: InvoiceStatus.DRAFT },
      childProfile: {
        archived: false,
        parentLinks: { some: { parentId } },
      },
    },
    include: {
      childProfile: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: [{ dueDate: "asc" }, { invoiceNumber: "asc" }],
  });
}

export async function getBillingMetrics(organizationId: string) {
  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { notIn: [InvoiceStatus.DRAFT, InvoiceStatus.VOID] },
    },
    select: { amountCents: true, status: true },
  });

  return invoices.reduce(
    (metrics, invoice) => {
      metrics.invoiceCount += 1;
      if (invoice.status === InvoiceStatus.PAID) {
        metrics.paidCents += invoice.amountCents;
      } else {
        metrics.outstandingCents += invoice.amountCents;
      }
      if (invoice.status === InvoiceStatus.OVERDUE) {
        metrics.overdueCount += 1;
      }
      return metrics;
    },
    {
      invoiceCount: 0,
      paidCents: 0,
      outstandingCents: 0,
      overdueCount: 0,
    }
  );
}
