import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/prisma", () => ({
  default: {
    enrollmentRequest: {
      create: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import prisma from "../../lib/prisma";
import {
  createEnrollmentRequest,
  getEnrollmentRequests,
  updateEnrollmentStatus,
} from "./enrollment.service";

describe("enrollment service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a public enrollment inquiry with supplied contact details", async () => {
    vi.mocked(prisma.enrollmentRequest.create).mockResolvedValue({
      id: "request-1",
    } as never);

    await createEnrollmentRequest({
      parentName: "Jordan Lee",
      email: "jordan@example.com",
      childName: "Avery Lee",
      childAge: 4,
    });

    expect(prisma.enrollmentRequest.create).toHaveBeenCalledWith({
      data: {
        parentName: "Jordan Lee",
        email: "jordan@example.com",
        phone: undefined,
        childName: "Avery Lee",
        childAge: 4,
        requestedStartDate: undefined,
        requestedProgram: undefined,
        requestedAttendanceDays: [],
        siblingEnrolled: false,
        message: undefined,
      },
    });
  });

  it("lists organization-owned and unassigned public inquiries", async () => {
    vi.mocked(prisma.enrollmentRequest.findMany).mockResolvedValue([]);

    await getEnrollmentRequests("org-a");

    expect(prisma.enrollmentRequest.findMany).toHaveBeenCalledWith({
      where: {
        OR: [{ organizationId: "org-a" }, { organizationId: null }],
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("does not include inquiries assigned to a different organization", async () => {
    vi.mocked(prisma.enrollmentRequest.findMany).mockResolvedValue([]);

    await getEnrollmentRequests("org-b");

    const query = vi.mocked(prisma.enrollmentRequest.findMany).mock.calls[0][0];
    expect(query?.where).toEqual({
      OR: [{ organizationId: "org-b" }, { organizationId: null }],
    });
  });

  it("claims an unassigned inquiry when an organization updates its status", async () => {
    vi.mocked(prisma.enrollmentRequest.updateMany).mockResolvedValue({ count: 1 });

    await updateEnrollmentStatus("request-1", "org-a", "CONTACTED");

    expect(prisma.enrollmentRequest.updateMany).toHaveBeenCalledWith({
      where: {
        id: "request-1",
        OR: [{ organizationId: "org-a" }, { organizationId: null }],
      },
      data: {
        status: "CONTACTED",
        organizationId: "org-a",
      },
    });
  });
});
