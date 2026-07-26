import { UserRole } from "@prisma/client";
import prisma from "../../lib/prisma";

export type SendMessageInput = {
  recipientIds: string[];
  subject: string;
  body: string;
};

export type DraftInput = {
  topic: string;
  tone?: string;
  details?: string;
};

export async function getParentRecipients(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId, role: UserRole.PARENT },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      childLinks: {
        select: {
          childProfile: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function sendParentMessage(
  organizationId: string,
  senderId: string,
  input: SendMessageInput
) {
  const recipientIds = [...new Set(input.recipientIds ?? [])];
  if (!input.subject?.trim() || !input.body?.trim() || recipientIds.length === 0) {
    throw new Error("Recipients, subject, and message are required.");
  }

  const validRecipientCount = await prisma.user.count({
    where: {
      id: { in: recipientIds },
      organizationId,
      role: UserRole.PARENT,
    },
  });
  if (validRecipientCount !== recipientIds.length) {
    throw new Error("One or more recipients are unavailable.");
  }

  return prisma.message.create({
    data: {
      organizationId,
      createdById: senderId,
      subject: input.subject.trim(),
      body: input.body.trim(),
      recipients: {
        create: recipientIds.map((recipientId) => ({ recipientId })),
      },
    },
    include: {
      recipients: {
        include: {
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export function generateMessageDraft(input: DraftInput) {
  const topic = input.topic?.trim();
  if (!topic) throw new Error("A draft topic is required.");

  const tone = input.tone?.trim().toLowerCase() || "friendly";
  const details = input.details?.trim();
  const subject = topic[0].toUpperCase() + topic.slice(1);
  const opening =
    tone === "urgent"
      ? "Please note this important update:"
      : tone === "formal"
        ? "We are writing to share the following update:"
        : "We wanted to share a quick update:";
  const detailSentence = details
    ? ` ${details}`
    : " Additional information will be shared as it becomes available.";

  return {
    subject,
    body: `Dear BrightPath families,\n\n${opening} ${topic}.${detailSentence}\n\nPlease contact the center if you have any questions.\n\nThank you,\nBrightPath Childcare`,
    generatedAt: new Date().toISOString(),
    requiresReview: true,
  };
}
