import prisma from "../../lib/prisma";

type CreateEnrollmentRequestInput = {
  parentName: string;
  email: string;
  phone?: string;
  childName: string;
  childAge?: number;
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