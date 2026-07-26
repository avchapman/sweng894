import prisma from "../../lib/prisma";

export async function getLinkedChildren(
  parentId: string,
  organizationId: string
) {
  const links = await prisma.parentChildLink.findMany({
    where: {
      parentId,
      childProfile: {
        organizationId,
        archived: false,
      },
    },
    include: {
      childProfile: {
        include: {
          organization: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: {
      childProfile: {
        firstName: "asc",
      },
    },
  });

  return links.map(({ childProfile }) => childProfile);
}

export async function getLinkedChildSchedules(
  parentId: string,
  organizationId: string
) {
  const links = await prisma.parentChildLink.findMany({
    where: {
      parentId,
      childProfile: {
        organizationId,
        archived: false,
      },
    },
    select: { childProfileId: true },
  });
  const childProfileIds = links.map((link) => link.childProfileId);

  if (childProfileIds.length === 0) return [];

  return prisma.scheduleEntry.findMany({
    where: {
      organizationId,
      assignments: {
        some: {
          childProfileId: { in: childProfileIds },
        },
      },
    },
    include: {
      assignments: {
        where: {
          childProfileId: { in: childProfileIds },
        },
        include: {
          childProfile: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });
}
