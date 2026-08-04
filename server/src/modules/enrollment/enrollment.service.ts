import prisma from "../../lib/prisma";

type CreateEnrollmentRequestInput = {
  parentName: string;
  email: string;
  phone?: string;
  childName: string;
  childAge?: number;
  requestedStartDate?: string;
  requestedProgram?: string;
  requestedAttendanceDays?: string[];
  siblingEnrolled?: boolean;
  message?: string;
};

export async function createEnrollmentRequest(data: CreateEnrollmentRequestInput) {
  return prisma.enrollmentRequest.create({
    data: {
      parentName: data.parentName,
      email: data.email,
      phone: data.phone,
      childName: data.childName,
      childAge: data.childAge,
      requestedStartDate: data.requestedStartDate
        ? new Date(data.requestedStartDate)
        : undefined,
      requestedProgram: data.requestedProgram?.trim() || undefined,
      requestedAttendanceDays: data.requestedAttendanceDays ?? [],
      siblingEnrolled: data.siblingEnrolled ?? false,
      message: data.message,
    },
  });
}

export async function getEnrollmentRequests(organizationId: string) {
  return prisma.enrollmentRequest.findMany({
    where: {
      OR: [{ organizationId }, { organizationId: null }],
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function updateEnrollmentStatus(
  id: string,
  organizationId: string,
  status: string
) {
  return prisma.enrollmentRequest.updateMany({
    where: {
      id,
      OR: [{ organizationId }, { organizationId: null }],
    },
    data: {
      status,
      organizationId,
    },
  });
}
