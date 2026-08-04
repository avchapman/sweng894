import prisma from "../../lib/prisma";

export type ProgramCapacityInput = {
  programName: string;
  minimumAgeYears: number;
  maximumAgeYears: number;
  supportedAttendanceDays: string[];
  totalCapacity: number;
  occupiedSeats?: number;
  effectiveDate: string;
};

const VALID_ATTENDANCE_DAYS = new Set([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

export function validateProgramCapacity(input: ProgramCapacityInput) {
  const programName = input.programName?.trim();
  const occupiedSeats = input.occupiedSeats ?? 0;
  const effectiveDate = new Date(input.effectiveDate);
  const supportedAttendanceDays = [
    ...new Set(
      (input.supportedAttendanceDays ?? []).map((day) =>
        day.trim().toUpperCase()
      )
    ),
  ];

  if (!programName) throw new Error("Program name is required.");
  if (
    !Number.isInteger(input.minimumAgeYears) ||
    !Number.isInteger(input.maximumAgeYears) ||
    input.minimumAgeYears < 0 ||
    input.maximumAgeYears < input.minimumAgeYears
  ) {
    throw new Error("Program age limits are invalid.");
  }
  if (
    !Number.isInteger(input.totalCapacity) ||
    !Number.isInteger(occupiedSeats) ||
    input.totalCapacity < 0 ||
    occupiedSeats < 0 ||
    occupiedSeats > input.totalCapacity
  ) {
    throw new Error(
      "Capacity values must be whole numbers and occupied seats cannot exceed total capacity."
    );
  }
  if (
    supportedAttendanceDays.length === 0 ||
    supportedAttendanceDays.some((day) => !VALID_ATTENDANCE_DAYS.has(day))
  ) {
    throw new Error("At least one valid attendance day is required.");
  }
  if (Number.isNaN(effectiveDate.getTime())) {
    throw new Error("A valid effective date is required.");
  }

  return {
    programName,
    minimumAgeYears: input.minimumAgeYears,
    maximumAgeYears: input.maximumAgeYears,
    supportedAttendanceDays,
    totalCapacity: input.totalCapacity,
    occupiedSeats,
    effectiveDate,
  };
}

export function availableSeats(totalCapacity: number, occupiedSeats: number) {
  return Math.max(0, totalCapacity - occupiedSeats);
}

export async function getProgramCapacities(organizationId: string) {
  const capacities = await prisma.programCapacity.findMany({
    where: { organizationId },
    orderBy: [{ programName: "asc" }, { effectiveDate: "desc" }],
  });
  return capacities.map((capacity) => ({
    ...capacity,
    availableSeats: availableSeats(
      capacity.totalCapacity,
      capacity.occupiedSeats
    ),
  }));
}

export async function createProgramCapacity(
  organizationId: string,
  input: ProgramCapacityInput
) {
  const validated = validateProgramCapacity(input);
  return prisma.programCapacity.create({
    data: { ...validated, organizationId },
  });
}

export async function updateProgramCapacity(
  id: string,
  organizationId: string,
  input: ProgramCapacityInput
) {
  const existing = await prisma.programCapacity.findFirst({
    where: { id, organizationId },
    select: { id: true },
  });
  if (!existing) return null;
  const validated = validateProgramCapacity(input);
  return prisma.programCapacity.update({
    where: { id },
    data: validated,
  });
}
