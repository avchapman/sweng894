import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/prisma", () => ({
  default: {
    parentChildLink: { findMany: vi.fn() },
    scheduleEntry: { findMany: vi.fn() },
  },
}));

import prisma from "../../lib/prisma";
import {
  getLinkedChildren,
  getLinkedChildSchedules,
} from "./parentPortal.service";

describe("parent portal service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only active linked children in the parent's organization", async () => {
    vi.mocked(prisma.parentChildLink.findMany).mockResolvedValue([
      { childProfile: { id: "child-1", firstName: "Emma" } },
    ] as never);

    const result = await getLinkedChildren("parent-1", "org-1");

    expect(prisma.parentChildLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          parentId: "parent-1",
          childProfile: { organizationId: "org-1", archived: false },
        },
      })
    );
    expect(result).toEqual([{ id: "child-1", firstName: "Emma" }]);
  });

  it("returns an empty child list when the parent has no links", async () => {
    vi.mocked(prisma.parentChildLink.findMany).mockResolvedValue([]);

    await expect(getLinkedChildren("parent-1", "org-1")).resolves.toEqual([]);
  });

  it("does not query schedules when no linked children exist", async () => {
    vi.mocked(prisma.parentChildLink.findMany).mockResolvedValue([]);

    await expect(
      getLinkedChildSchedules("parent-1", "org-1")
    ).resolves.toEqual([]);
    expect(prisma.scheduleEntry.findMany).not.toHaveBeenCalled();
  });

  it("lists only schedules assigned to the parent's linked children", async () => {
    vi.mocked(prisma.parentChildLink.findMany).mockResolvedValue([
      { childProfileId: "child-1" },
      { childProfileId: "child-2" },
    ] as never);
    vi.mocked(prisma.scheduleEntry.findMany).mockResolvedValue([]);

    await getLinkedChildSchedules("parent-1", "org-1");

    expect(prisma.scheduleEntry.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: "org-1",
        assignments: {
          some: {
            childProfileId: { in: ["child-1", "child-2"] },
          },
        },
      },
      include: {
        assignments: {
          where: {
            childProfileId: { in: ["child-1", "child-2"] },
          },
          include: { childProfile: true },
        },
      },
      orderBy: { startTime: "asc" },
    });
  });

  it("preserves chronological schedule results from the database", async () => {
    const schedules = [
      { id: "early", startTime: new Date("2026-08-01") },
      { id: "late", startTime: new Date("2026-08-02") },
    ];
    vi.mocked(prisma.parentChildLink.findMany).mockResolvedValue([
      { childProfileId: "child-1" },
    ] as never);
    vi.mocked(prisma.scheduleEntry.findMany).mockResolvedValue(
      schedules as never
    );

    await expect(
      getLinkedChildSchedules("parent-1", "org-1")
    ).resolves.toEqual(schedules);
  });
});
