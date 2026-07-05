import prisma from "../../lib/prisma";

type CreateChildProfileInput = {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  notes?: string;
};

type UpdateChildProfileInput = Partial<CreateChildProfileInput> & {
  archived?: boolean;
};

export async function getChildProfiles(organizationId: string) {
  return prisma.childProfile.findMany({
    where: {
      organizationId,
      archived: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createChildProfile(
  organizationId: string,
  data: CreateChildProfileInput
) {
  return prisma.childProfile.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      notes: data.notes,
      organizationId,
    },
  });
}

export async function updateChildProfile(
  id: string,
  organizationId: string,
  data: UpdateChildProfileInput
) {
  return prisma.childProfile.updateMany({
    where: {
      id,
      organizationId,
    },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      notes: data.notes,
      archived: data.archived,
    },
  });
}

export async function archiveChildProfile(id: string, organizationId: string) {
  return prisma.childProfile.updateMany({
    where: {
      id,
      organizationId,
    },
    data: {
      archived: true,
    },
  });
}