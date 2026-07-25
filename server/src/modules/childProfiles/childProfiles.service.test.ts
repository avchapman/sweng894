import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/prisma", () => ({
  default: {
    childProfile: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import prisma from "../../lib/prisma";
import {
  archiveChildProfile,
  createChildProfile,
  getChildProfiles,
  updateChildProfile,
} from "./childProfiles.service";

describe("child profile service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists only active child profiles from the authenticated organization", async () => {
    vi.mocked(prisma.childProfile.findMany).mockResolvedValue([]);

    await getChildProfiles("org-a");

    expect(prisma.childProfile.findMany).toHaveBeenCalledWith({
      where: { organizationId: "org-a", archived: false },
      orderBy: { createdAt: "desc" },
    });
  });

  it("creates a profile in the authenticated organization", async () => {
    vi.mocked(prisma.childProfile.create).mockResolvedValue({ id: "child-1" } as never);

    await createChildProfile("org-a", {
      firstName: "Maya",
      lastName: "Rivera",
      notes: "Allergy",
    });

    expect(prisma.childProfile.create).toHaveBeenCalledWith({
      data: {
        firstName: "Maya",
        lastName: "Rivera",
        dateOfBirth: undefined,
        notes: "Allergy",
        organizationId: "org-a",
      },
    });
  });

  it("normalizes a supplied date of birth when creating a profile", async () => {
    vi.mocked(prisma.childProfile.create).mockResolvedValue({ id: "child-1" } as never);

    await createChildProfile("org-a", {
      firstName: "Maya",
      lastName: "Rivera",
      dateOfBirth: "2020-05-12",
    });

    const call = vi.mocked(prisma.childProfile.create).mock.calls[0][0];
    expect(call.data.dateOfBirth).toEqual(new Date("2020-05-12"));
  });

  it("scopes profile updates by both record and organization ID", async () => {
    vi.mocked(prisma.childProfile.updateMany).mockResolvedValue({ count: 1 });

    await updateChildProfile("child-1", "org-a", { notes: "Updated" });

    expect(prisma.childProfile.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "child-1", organizationId: "org-a" },
      })
    );
  });

  it("archives only a matching profile in the authenticated organization", async () => {
    vi.mocked(prisma.childProfile.updateMany).mockResolvedValue({ count: 1 });

    await archiveChildProfile("child-1", "org-a");

    expect(prisma.childProfile.updateMany).toHaveBeenCalledWith({
      where: { id: "child-1", organizationId: "org-a" },
      data: { archived: true },
    });
  });
});
