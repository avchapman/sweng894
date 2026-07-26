import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/prisma", () => ({
  default: {
    user: { findMany: vi.fn(), count: vi.fn() },
    message: { create: vi.fn() },
  },
}));

import prisma from "../../lib/prisma";
import {
  generateMessageDraft,
  getParentRecipients,
  sendParentMessage,
} from "./messages.service";

describe("message service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists only parent recipients in the authenticated organization", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    await getParentRecipients("org-1");

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "org-1", role: "PARENT" },
      })
    );
  });

  it("requires recipients, subject, and body", async () => {
    await expect(
      sendParentMessage("org-1", "staff-1", {
        recipientIds: [],
        subject: "",
        body: "",
      })
    ).rejects.toThrow("Recipients, subject, and message are required.");
  });

  it("rejects recipients outside the organization or parent role", async () => {
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    await expect(
      sendParentMessage("org-1", "staff-1", {
        recipientIds: ["parent-1", "invalid-user"],
        subject: "Reminder",
        body: "Family picnic Friday.",
      })
    ).rejects.toThrow("One or more recipients are unavailable.");
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it("deduplicates recipients and creates a reviewed message", async () => {
    vi.mocked(prisma.user.count).mockResolvedValue(2);
    vi.mocked(prisma.message.create).mockResolvedValue({
      id: "message-1",
    } as never);

    await sendParentMessage("org-1", "staff-1", {
      recipientIds: ["parent-1", "parent-1", "parent-2"],
      subject: " Reminder ",
      body: " Bring sunscreen. ",
    });

    expect(prisma.user.count).toHaveBeenCalledWith({
      where: {
        id: { in: ["parent-1", "parent-2"] },
        organizationId: "org-1",
        role: "PARENT",
      },
    });
    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          createdById: "staff-1",
          subject: "Reminder",
          body: "Bring sunscreen.",
          recipients: {
            create: [
              { recipientId: "parent-1" },
              { recipientId: "parent-2" },
            ],
          },
        }),
      })
    );
  });

  it("requires a topic before generating a draft", () => {
    expect(() => generateMessageDraft({ topic: " " })).toThrow(
      "A draft topic is required."
    );
  });

  it("generates editable content that requires human review", () => {
    const draft = generateMessageDraft({
      topic: "weather closure",
      tone: "urgent",
      details: "The center will be closed tomorrow",
    });

    expect(draft.subject).toBe("Weather closure");
    expect(draft.body).toContain("important update");
    expect(draft.body).toContain("The center will be closed tomorrow");
    expect(draft.requiresReview).toBe(true);
  });
});
