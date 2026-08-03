import { describe, expect, it } from "vitest";
import {
  CapacityRule,
  EnrollmentCandidate,
  recommendEnrollmentPlacements,
} from "./enrollmentRecommendations.algorithm";

const now = new Date("2026-08-03T12:00:00.000Z");
const capacity: CapacityRule = {
  id: "capacity-preschool",
  organizationId: "org-a",
  programName: "Preschool",
  minimumAgeYears: 3,
  maximumAgeYears: 5,
  supportedAttendanceDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
  totalCapacity: 2,
  occupiedSeats: 1,
  effectiveDate: new Date("2026-08-01T00:00:00.000Z"),
};

function candidate(
  overrides: Partial<EnrollmentCandidate> = {}
): EnrollmentCandidate {
  return {
    id: "request-a",
    organizationId: "org-a",
    applicationDate: new Date("2026-06-01T12:00:00.000Z"),
    requestedStartDate: new Date("2026-08-10T12:00:00.000Z"),
    requestedProgram: "Preschool",
    requestedAttendanceDays: ["MONDAY", "WEDNESDAY"],
    childAge: 4,
    siblingEnrolled: false,
    phone: "555-0100",
    message: "Interested in fall enrollment.",
    ...overrides,
  };
}

describe("enrollment recommendation algorithm", () => {
  it("returns an explainable score within the configured 0-100 range", () => {
    const [result] = recommendEnrollmentPlacements(
      [candidate()],
      [capacity],
      "org-a",
      now
    );

    expect(result.status).toBe("PLACEMENT_RECOMMENDED");
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.components).toMatchObject({
      scheduleCompatibility: 20,
      siblingContinuity: 0,
      recordCompleteness: 5,
    });
    expect(result.explanation).toContain("Placement recommended");
  });

  it("never recommends more placements than available seats", () => {
    const results = recommendEnrollmentPlacements(
      [candidate({ id: "request-a" }), candidate({ id: "request-b" })],
      [capacity],
      "org-a",
      now
    );

    expect(results.filter((result) => result.status === "PLACEMENT_RECOMMENDED"))
      .toHaveLength(1);
    expect(results.find((result) => result.status === "WAITLISTED")).toMatchObject({
      rank: 1,
      reasonCodes: ["CAPACITY_EXHAUSTED"],
    });
  });

  it("uses application time and request id as deterministic tie-breakers", () => {
    const later = candidate({
      id: "request-c",
      applicationDate: new Date("2026-06-02T12:00:00.000Z"),
    });
    const earlierB = candidate({ id: "request-b" });
    const earlierA = candidate({ id: "request-a" });
    const expandedCapacity = { ...capacity, totalCapacity: 1, occupiedSeats: 1 };

    const first = recommendEnrollmentPlacements(
      [later, earlierB, earlierA],
      [expandedCapacity],
      "org-a",
      now
    );
    const second = recommendEnrollmentPlacements(
      [earlierA, later, earlierB],
      [expandedCapacity],
      "org-a",
      now
    );

    expect(first.map(({ requestId }) => requestId)).toEqual([
      "request-a",
      "request-b",
      "request-c",
    ]);
    expect(second).toEqual(first);
  });

  it.each([
    [{ organizationId: "org-b" }, "WRONG_ORGANIZATION"],
    [{ requestedProgram: null }, "MISSING_PROGRAM"],
    [{ requestedStartDate: null }, "INVALID_START_DATE"],
    [{ childAge: 8 }, "AGE_NOT_ELIGIBLE"],
    [{ requestedAttendanceDays: ["SUNDAY"] }, "UNSUPPORTED_ATTENDANCE_PATTERN"],
  ] as Array<[Partial<EnrollmentCandidate>, string]>) (
    "marks requests ineligible when a hard constraint fails",
    (overrides, reasonCode) => {
      const [result] = recommendEnrollmentPlacements(
        [candidate(overrides)],
        [capacity],
        "org-a",
        now
      );
      expect(result.status).toBe("INELIGIBLE");
      expect(result.reasonCodes).toContain(reasonCode);
      expect(result.score).toBeNull();
    }
  );

  it("does not mutate request records or capacity inputs", () => {
    const request = candidate();
    const requestSnapshot = structuredClone(request);
    const capacitySnapshot = structuredClone(capacity);

    recommendEnrollmentPlacements([request], [capacity], "org-a", now);

    expect(request).toEqual(requestSnapshot);
    expect(capacity).toEqual(capacitySnapshot);
  });

  it("processes 5,000 synthetic requests in under one second", () => {
    const requests = Array.from({ length: 5000 }, (_, index) =>
      candidate({ id: `request-${index.toString().padStart(5, "0")}` })
    );
    const startedAt = performance.now();

    const results = recommendEnrollmentPlacements(
      requests,
      [{ ...capacity, totalCapacity: 5000, occupiedSeats: 0 }],
      "org-a",
      now
    );

    expect(performance.now() - startedAt).toBeLessThan(1000);
    expect(results).toHaveLength(5000);
  });
});
