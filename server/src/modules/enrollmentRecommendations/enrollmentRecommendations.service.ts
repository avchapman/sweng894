import prisma from "../../lib/prisma";
import { recommendEnrollmentPlacements } from "./enrollmentRecommendations.algorithm";

export async function getEnrollmentRecommendations(organizationId: string) {
  const [requests, capacities] = await Promise.all([
    prisma.enrollmentRequest.findMany({
      where: { organizationId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    prisma.programCapacity.findMany({
      where: { organizationId, effectiveDate: { lte: new Date() } },
      orderBy: [{ effectiveDate: "desc" }, { programName: "asc" }],
    }),
  ]);

  const latestCapacityByProgram = new Map<string, (typeof capacities)[number]>();
  for (const capacity of capacities) {
    const key = capacity.programName.trim().toLowerCase();
    if (!latestCapacityByProgram.has(key)) latestCapacityByProgram.set(key, capacity);
  }

  return recommendEnrollmentPlacements(
    requests.map((request) => ({
      id: request.id,
      organizationId: request.organizationId,
      applicationDate: request.createdAt,
      requestedStartDate: request.requestedStartDate,
      requestedProgram: request.requestedProgram,
      requestedAttendanceDays: request.requestedAttendanceDays,
      childAge: request.childAge,
      siblingEnrolled: request.siblingEnrolled,
      phone: request.phone,
      message: request.message,
    })),
    [...latestCapacityByProgram.values()],
    organizationId
  );
}
