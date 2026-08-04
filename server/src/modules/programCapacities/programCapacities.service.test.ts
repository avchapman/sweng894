import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/prisma", () => ({
  default: {
    programCapacity: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from "../../lib/prisma";
import {
  availableSeats,
  createProgramCapacity,
  getProgramCapacities,
  updateProgramCapacity,
  validateProgramCapacity,
} from "./programCapacities.service";

const validInput = {
  programName: " Preschool ",
  minimumAgeYears: 3,
  maximumAgeYears: 5,
  supportedAttendanceDays: ["monday", "WEDNESDAY", "monday"],
  totalCapacity: 20,
  occupiedSeats: 12,
  effectiveDate: "2026-08-01",
};

describe("program capacity service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes and validates a capacity record", () => {
    expect(validateProgramCapacity(validInput)).toMatchObject({
      programName: "Preschool",
      supportedAttendanceDays: ["MONDAY", "WEDNESDAY"],
      totalCapacity: 20,
      occupiedSeats: 12,
    });
  });

  it.each([
    [{ ...validInput, programName: "" }, "Program name"],
    [{ ...validInput, minimumAgeYears: 6 }, "age limits"],
    [{ ...validInput, occupiedSeats: 21 }, "occupied seats"],
    [{ ...validInput, supportedAttendanceDays: [] }, "attendance day"],
    [{ ...validInput, effectiveDate: "not-a-date" }, "effective date"],
  ])("rejects invalid capacity configuration", (input, message) => {
    expect(() => validateProgramCapacity(input)).toThrow(message);
  });

  it("calculates available seats without returning a negative number", () => {
    expect(availableSeats(20, 12)).toBe(8);
    expect(availableSeats(10, 12)).toBe(0);
  });

  it("lists only the authenticated organization's capacities", async () => {
    vi.mocked(prisma.programCapacity.findMany).mockResolvedValue([
      { totalCapacity: 20, occupiedSeats: 12 } as never,
    ]);

    const results = await getProgramCapacities("org-a");

    expect(prisma.programCapacity.findMany).toHaveBeenCalledWith({
      where: { organizationId: "org-a" },
      orderBy: [{ programName: "asc" }, { effectiveDate: "desc" }],
    });
    expect(results[0]).toMatchObject({ availableSeats: 8 });
  });

  it("creates a normalized organization-scoped capacity", async () => {
    vi.mocked(prisma.programCapacity.create).mockResolvedValue({ id: "cap-1" } as never);

    await createProgramCapacity("org-a", validInput);

    expect(prisma.programCapacity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org-a",
        programName: "Preschool",
        supportedAttendanceDays: ["MONDAY", "WEDNESDAY"],
      }),
    });
  });

  it("does not update a capacity owned by another organization", async () => {
    vi.mocked(prisma.programCapacity.findFirst).mockResolvedValue(null);

    expect(await updateProgramCapacity("cap-1", "org-b", validInput)).toBeNull();
    expect(prisma.programCapacity.update).not.toHaveBeenCalled();
  });

  it("updates an existing same-organization capacity", async () => {
    vi.mocked(prisma.programCapacity.findFirst).mockResolvedValue({ id: "cap-1" } as never);
    vi.mocked(prisma.programCapacity.update).mockResolvedValue({ id: "cap-1" } as never);

    await updateProgramCapacity("cap-1", "org-a", validInput);

    expect(prisma.programCapacity.findFirst).toHaveBeenCalledWith({
      where: { id: "cap-1", organizationId: "org-a" },
      select: { id: true },
    });
    expect(prisma.programCapacity.update).toHaveBeenCalledWith({
      where: { id: "cap-1" },
      data: expect.objectContaining({ programName: "Preschool" }),
    });
  });
});
