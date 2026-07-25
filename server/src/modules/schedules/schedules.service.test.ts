import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/prisma", () => ({
  default: {
    childProfile: { count: vi.fn() },
    scheduleEntry: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import prisma from "../../lib/prisma";
import {
  createScheduleEntry,
  deleteScheduleEntry,
  getScheduleEntries,
  updateScheduleEntry,
  validateScheduleTimes,
} from "./schedules.service";

const input = {
  title: "Preschool Art Class",
  startTime: "2026-08-03T13:00:00.000Z",
  endTime: "2026-08-03T14:00:00.000Z",
  location: "Room 2",
  childProfileIds: ["child-1", "child-2"],
};

describe("schedule service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists only schedule entries from the authenticated organization", async () => {
    vi.mocked(prisma.scheduleEntry.findMany).mockResolvedValue([]);

    await getScheduleEntries("org-a");

    expect(prisma.scheduleEntry.findMany).toHaveBeenCalledWith({
      where: { organizationId: "org-a" },
      include: {
        assignments: { include: { childProfile: true } },
      },
      orderBy: { startTime: "asc" },
    });
  });

  it("rejects an end time that is not after the start time", () => {
    expect(() =>
      validateScheduleTimes(
        "2026-08-03T14:00:00.000Z",
        "2026-08-03T13:00:00.000Z"
      )
    ).toThrow("Schedule end time must be after its start time.");
  });

  it("rejects invalid date values", () => {
    expect(() => validateScheduleTimes("invalid", "also-invalid")).toThrow(
      "Schedule end time must be after its start time."
    );
  });

  it("creates an organization-scoped entry with unique child assignments", async () => {
    vi.mocked(prisma.childProfile.count).mockResolvedValue(2);
    vi.mocked(prisma.scheduleEntry.create).mockResolvedValue({
      id: "schedule-1",
    } as never);

    await createScheduleEntry("org-a", {
      ...input,
      childProfileIds: ["child-1", "child-1", "child-2"],
    });

    expect(prisma.childProfile.count).toHaveBeenCalledWith({
      where: {
        id: { in: ["child-1", "child-2"] },
        organizationId: "org-a",
        archived: false,
      },
    });
    expect(prisma.scheduleEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-a",
          assignments: {
            create: [
              { childProfileId: "child-1" },
              { childProfileId: "child-2" },
            ],
          },
        }),
      })
    );
  });

  it("creates a schedule without querying child profiles when none are assigned", async () => {
    vi.mocked(prisma.scheduleEntry.create).mockResolvedValue({
      id: "schedule-1",
    } as never);

    await createScheduleEntry("org-a", {
      ...input,
      childProfileIds: [],
    });

    expect(prisma.childProfile.count).not.toHaveBeenCalled();
  });

  it("rejects child assignments outside the organization", async () => {
    vi.mocked(prisma.childProfile.count).mockResolvedValue(1);

    await expect(createScheduleEntry("org-a", input)).rejects.toThrow(
      "One or more child profiles are unavailable for this organization."
    );
    expect(prisma.scheduleEntry.create).not.toHaveBeenCalled();
  });

  it("returns null rather than updating another organization's entry", async () => {
    vi.mocked(prisma.scheduleEntry.findFirst).mockResolvedValue(null);

    const result = await updateScheduleEntry("schedule-1", "org-b", input);

    expect(result).toBeNull();
    expect(prisma.scheduleEntry.update).not.toHaveBeenCalled();
  });

  it("replaces assignments when updating an organization-owned entry", async () => {
    vi.mocked(prisma.scheduleEntry.findFirst).mockResolvedValue({
      id: "schedule-1",
    });
    vi.mocked(prisma.childProfile.count).mockResolvedValue(2);
    vi.mocked(prisma.scheduleEntry.update).mockResolvedValue({
      id: "schedule-1",
    } as never);

    await updateScheduleEntry("schedule-1", "org-a", input);

    expect(prisma.scheduleEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "schedule-1" },
        data: expect.objectContaining({
          assignments: {
            deleteMany: {},
            create: [
              { childProfileId: "child-1" },
              { childProfileId: "child-2" },
            ],
          },
        }),
      })
    );
  });

  it("deletes only a schedule entry in the authenticated organization", async () => {
    vi.mocked(prisma.scheduleEntry.deleteMany).mockResolvedValue({ count: 1 });

    await deleteScheduleEntry("schedule-1", "org-a");

    expect(prisma.scheduleEntry.deleteMany).toHaveBeenCalledWith({
      where: { id: "schedule-1", organizationId: "org-a" },
    });
  });
});
