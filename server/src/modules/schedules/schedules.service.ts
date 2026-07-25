import prisma from "../../lib/prisma";

export type ScheduleEntryInput = {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  childProfileIds?: string[];
};

function uniqueChildIds(childProfileIds: string[] = []) {
  return [...new Set(childProfileIds)];
}

export function validateScheduleTimes(startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    throw new Error("Schedule end time must be after its start time.");
  }

  return { start, end };
}

async function validateChildProfiles(
  organizationId: string,
  childProfileIds: string[]
) {
  if (childProfileIds.length === 0) return;

  const matchingProfiles = await prisma.childProfile.count({
    where: {
      id: { in: childProfileIds },
      organizationId,
      archived: false,
    },
  });

  if (matchingProfiles !== childProfileIds.length) {
    throw new Error(
      "One or more child profiles are unavailable for this organization."
    );
  }
}

export async function getScheduleEntries(organizationId: string) {
  return prisma.scheduleEntry.findMany({
    where: { organizationId },
    include: {
      assignments: {
        include: { childProfile: true },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function createScheduleEntry(
  organizationId: string,
  data: ScheduleEntryInput
) {
  const { start, end } = validateScheduleTimes(data.startTime, data.endTime);
  const childProfileIds = uniqueChildIds(data.childProfileIds);
  await validateChildProfiles(organizationId, childProfileIds);

  return prisma.scheduleEntry.create({
    data: {
      title: data.title,
      description: data.description,
      startTime: start,
      endTime: end,
      location: data.location,
      organizationId,
      assignments: {
        create: childProfileIds.map((childProfileId) => ({ childProfileId })),
      },
    },
    include: {
      assignments: {
        include: { childProfile: true },
      },
    },
  });
}

export async function updateScheduleEntry(
  id: string,
  organizationId: string,
  data: ScheduleEntryInput
) {
  const existing = await prisma.scheduleEntry.findFirst({
    where: { id, organizationId },
    select: { id: true },
  });

  if (!existing) return null;

  const { start, end } = validateScheduleTimes(data.startTime, data.endTime);
  const childProfileIds = uniqueChildIds(data.childProfileIds);
  await validateChildProfiles(organizationId, childProfileIds);

  return prisma.scheduleEntry.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      startTime: start,
      endTime: end,
      location: data.location,
      assignments: {
        deleteMany: {},
        create: childProfileIds.map((childProfileId) => ({ childProfileId })),
      },
    },
    include: {
      assignments: {
        include: { childProfile: true },
      },
    },
  });
}

export async function deleteScheduleEntry(
  id: string,
  organizationId: string
) {
  return prisma.scheduleEntry.deleteMany({
    where: { id, organizationId },
  });
}
