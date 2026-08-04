export const RECOMMENDATION_WEIGHTS = {
  urgency: 25,
  waiting: 25,
  scheduleCompatibility: 20,
  capacityFit: 15,
  siblingContinuity: 10,
  recordCompleteness: 5,
} as const;

export type RecommendationStatus =
  | "PLACEMENT_RECOMMENDED"
  | "WAITLISTED"
  | "INELIGIBLE";

export type EnrollmentCandidate = {
  id: string;
  organizationId: string | null;
  applicationDate: Date;
  requestedStartDate: Date | null;
  requestedProgram: string | null;
  requestedAttendanceDays: string[];
  childAge: number | null;
  siblingEnrolled: boolean;
  phone?: string | null;
  message?: string | null;
};

export type CapacityRule = {
  id: string;
  organizationId: string;
  programName: string;
  minimumAgeYears: number;
  maximumAgeYears: number;
  supportedAttendanceDays: string[];
  totalCapacity: number;
  occupiedSeats: number;
  effectiveDate: Date;
};

export type ScoreComponents = {
  urgency: number;
  waiting: number;
  scheduleCompatibility: number;
  capacityFit: number;
  siblingContinuity: number;
  recordCompleteness: number;
};

export type EnrollmentRecommendation = {
  requestId: string;
  status: RecommendationStatus;
  rank: number | null;
  score: number | null;
  components: ScoreComponents | null;
  reasonCodes: string[];
  explanation: string;
  capacityId: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

function differenceInDays(later: Date, earlier: Date) {
  return Math.max(0, (later.getTime() - earlier.getTime()) / DAY_MS);
}

function normalizedDay(day: string) {
  return day.trim().toUpperCase();
}

function calculateComponents(
  request: EnrollmentCandidate,
  capacity: CapacityRule,
  now: Date
): ScoreComponents {
  const daysUntilStart = Math.max(
    0,
    (request.requestedStartDate!.getTime() - now.getTime()) / DAY_MS
  );
  const urgency =
    daysUntilStart <= 0
      ? RECOMMENDATION_WEIGHTS.urgency
      : Math.max(
          0,
          (1 - Math.min(daysUntilStart, 90) / 90) *
            RECOMMENDATION_WEIGHTS.urgency
        );
  const waiting =
    Math.min(differenceInDays(now, request.applicationDate) / 90, 1) *
    RECOMMENDATION_WEIGHTS.waiting;
  const requestedDays = new Set(
    request.requestedAttendanceDays.map(normalizedDay)
  );
  const supportedDays = new Set(
    capacity.supportedAttendanceDays.map(normalizedDay)
  );
  const matchedDays = [...requestedDays].filter((day) => supportedDays.has(day));
  const scheduleCompatibility =
    (matchedDays.length / requestedDays.size) *
    RECOMMENDATION_WEIGHTS.scheduleCompatibility;
  const availableSeats = Math.max(
    0,
    capacity.totalCapacity - capacity.occupiedSeats
  );
  const capacityFit =
    capacity.totalCapacity === 0
      ? 0
      : (availableSeats / capacity.totalCapacity) *
        RECOMMENDATION_WEIGHTS.capacityFit;
  const siblingContinuity = request.siblingEnrolled
    ? RECOMMENDATION_WEIGHTS.siblingContinuity
    : 0;
  const optionalFields = [
    request.phone,
    request.message,
    request.childAge,
    request.requestedAttendanceDays.length ? "attendance" : null,
  ];
  const completedOptionalFields = optionalFields.filter(
    (value) => value !== null && value !== undefined && value !== ""
  ).length;
  const recordCompleteness =
    (completedOptionalFields / optionalFields.length) *
    RECOMMENDATION_WEIGHTS.recordCompleteness;

  return {
    urgency: roundScore(urgency),
    waiting: roundScore(waiting),
    scheduleCompatibility: roundScore(scheduleCompatibility),
    capacityFit: roundScore(capacityFit),
    siblingContinuity: roundScore(siblingContinuity),
    recordCompleteness: roundScore(recordCompleteness),
  };
}

function validateCandidate(
  request: EnrollmentCandidate,
  organizationId: string,
  capacityByProgram: Map<string, CapacityRule>
) {
  const reasons: string[] = [];
  if (request.organizationId !== organizationId) reasons.push("WRONG_ORGANIZATION");
  if (!request.requestedProgram) reasons.push("MISSING_PROGRAM");
  if (!request.requestedStartDate || Number.isNaN(request.requestedStartDate.getTime())) {
    reasons.push("INVALID_START_DATE");
  }
  if (request.childAge === null || request.childAge < 0) reasons.push("INVALID_CHILD_AGE");
  if (request.requestedAttendanceDays.length === 0) {
    reasons.push("MISSING_ATTENDANCE_PATTERN");
  }

  const capacity = request.requestedProgram
    ? capacityByProgram.get(request.requestedProgram.trim().toLowerCase())
    : undefined;
  if (!capacity) {
    reasons.push("NO_CAPACITY_RULE");
    return { reasons, capacity: null };
  }
  if (
    request.childAge !== null &&
    (request.childAge < capacity.minimumAgeYears ||
      request.childAge > capacity.maximumAgeYears)
  ) {
    reasons.push("AGE_NOT_ELIGIBLE");
  }
  const supported = new Set(
    capacity.supportedAttendanceDays.map(normalizedDay)
  );
  if (
    request.requestedAttendanceDays.some(
      (day) => !supported.has(normalizedDay(day))
    )
  ) {
    reasons.push("UNSUPPORTED_ATTENDANCE_PATTERN");
  }
  return { reasons, capacity };
}

export function recommendEnrollmentPlacements(
  requests: EnrollmentCandidate[],
  capacities: CapacityRule[],
  organizationId: string,
  now = new Date()
): EnrollmentRecommendation[] {
  const capacityByProgram = new Map(
    capacities
      .filter((capacity) => capacity.organizationId === organizationId)
      .map((capacity) => [capacity.programName.trim().toLowerCase(), capacity])
  );
  const eligibleByCapacity = new Map<
    string,
    Array<{
      request: EnrollmentCandidate;
      capacity: CapacityRule;
      components: ScoreComponents;
      score: number;
    }>
  >();
  const ineligible: EnrollmentRecommendation[] = [];

  for (const request of requests) {
    const { reasons, capacity } = validateCandidate(
      request,
      organizationId,
      capacityByProgram
    );
    if (reasons.length || !capacity) {
      ineligible.push({
        requestId: request.id,
        status: "INELIGIBLE",
        rank: null,
        score: null,
        components: null,
        reasonCodes: reasons,
        explanation: `Ineligible: ${reasons.join(", ").toLowerCase().replace(/_/g, " ")}.`,
        capacityId: capacity?.id ?? null,
      });
      continue;
    }
    const components = calculateComponents(request, capacity, now);
    const score = roundScore(
      Object.values(components).reduce((sum, value) => sum + value, 0)
    );
    const group = eligibleByCapacity.get(capacity.id) ?? [];
    group.push({ request, capacity, components, score });
    eligibleByCapacity.set(capacity.id, group);
  }

  const recommendations: EnrollmentRecommendation[] = [];
  for (const group of eligibleByCapacity.values()) {
    group.sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      const applicationDifference =
        left.request.applicationDate.getTime() -
        right.request.applicationDate.getTime();
      if (applicationDifference !== 0) return applicationDifference;
      return left.request.id.localeCompare(right.request.id);
    });

    const availableSeats = Math.max(
      0,
      group[0].capacity.totalCapacity - group[0].capacity.occupiedSeats
    );
    group.forEach(({ request, capacity, components, score }, index) => {
      const placementRecommended = index < availableSeats;
      recommendations.push({
        requestId: request.id,
        status: placementRecommended ? "PLACEMENT_RECOMMENDED" : "WAITLISTED",
        rank: placementRecommended ? null : index - availableSeats + 1,
        score,
        components,
        reasonCodes: placementRecommended
          ? ["CAPACITY_AVAILABLE"]
          : ["CAPACITY_EXHAUSTED"],
        explanation: placementRecommended
          ? `Placement recommended with score ${score}; capacity is available.`
          : `Waitlisted at rank ${index - availableSeats + 1} with score ${score}; higher-ranked requests consumed available capacity.`,
        capacityId: capacity.id,
      });
    });
  }

  return [...recommendations, ...ineligible].sort((left, right) => {
    const statusOrder: Record<RecommendationStatus, number> = {
      PLACEMENT_RECOMMENDED: 0,
      WAITLISTED: 1,
      INELIGIBLE: 2,
    };
    const statusDifference = statusOrder[left.status] - statusOrder[right.status];
    if (statusDifference !== 0) return statusDifference;
    if (left.status === "WAITLISTED" && right.status === "WAITLISTED") {
      return (left.rank ?? 0) - (right.rank ?? 0);
    }
    return left.requestId.localeCompare(right.requestId);
  });
}
