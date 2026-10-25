
export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH";

export type PriorityTicket = {
  id: string;
  status: string;
  priority: string;
  aiUrgency: string | null;
  aiEscalationRisk: string | null;
  createdAt: Date;
  latestCustomerMessageAt?: Date | null;
  latestMessageAuthorType?: string | null;
};

export type PriorityBreakdown = {
  score: number;
  urgencyScore: number;
  escalationScore: number;
  customerScore: number;
  waitingScore: number;
  missingAiData: boolean;
};

export type PriorityWeights = {
  urgency: number;
  escalation: number;
  customer: number;
  waiting: number;
};

export const PRIORITY_WEIGHTS: PriorityWeights = {
  urgency: 0.45,
  escalation: 0.25,
  customer: 0.15,
  waiting: 0.15,
};

const LEVEL_SCORES: Record<PriorityLevel, number> = {
  LOW: 20,
  MEDIUM: 60,
  HIGH: 100,
};

const MAX_WAIT_HOURS = 48;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

function isPriorityLevel(
  value: string | null
): value is PriorityLevel {
  return (
    value === "LOW" ||
    value === "MEDIUM" ||
    value === "HIGH"
  );
}

function toLevelScore(
  value: string | null
): number | null {
  if (!isPriorityLevel(value)) {
    return null;
  }

  return LEVEL_SCORES[value];
}

function calculateWaitingScore(
  waitingSince: Date,
  now: Date
): number {
  const elapsedMilliseconds = Math.max(
    0,
    now.getTime() - waitingSince.getTime()
  );

  const elapsedHours =
    elapsedMilliseconds / MILLISECONDS_PER_HOUR;

  return Math.min(
    100,
    (elapsedHours / MAX_WAIT_HOURS) * 100
  );
}

export function calculatePriorityScore(
  ticket: PriorityTicket,
  now: Date = new Date(),
  weights: PriorityWeights = PRIORITY_WEIGHTS
): PriorityBreakdown {
  const customerScore =
    toLevelScore(ticket.priority) ?? 60;

  const urgencyValue = toLevelScore(
    ticket.aiUrgency
  );

  const escalationValue = toLevelScore(
    ticket.aiEscalationRisk
  );

  const missingAiData =
    urgencyValue === null ||
    escalationValue === null;

  // Use customer priority when an AI signal is missing.
  const urgencyScore =
    urgencyValue ?? customerScore;

  const escalationScore =
    escalationValue ?? customerScore;

  const waitingForStaff =
    ticket.latestMessageAuthorType !== "STAFF";

  const waitingSince =
    ticket.latestCustomerMessageAt ??
    ticket.createdAt;

  const waitingScore = waitingForStaff
    ? calculateWaitingScore(waitingSince, now)
    : 0;

  const rawScore =
    weights.urgency * urgencyScore +
    weights.escalation * escalationScore +
    weights.customer * customerScore +
    weights.waiting * waitingScore;

  const score = Math.round(rawScore * 100) / 100;

  return {
    score,
    urgencyScore,
    escalationScore,
    customerScore,
    waitingScore,
    missingAiData,
  };
}

export function rankTickets<T extends PriorityTicket>(
  tickets: T[],
  now: Date = new Date(),
  weights: PriorityWeights = PRIORITY_WEIGHTS
): Array<T & { priorityBreakdown: PriorityBreakdown }> {
  return tickets
    .filter((ticket) => ticket.status !== "RESOLVED")
    .map((ticket) => ({
      ...ticket,
      priorityBreakdown: calculatePriorityScore(
        ticket,
        now,
        weights
      ),
    }))
    .sort((a, b) => {
      const scoreDifference =
        b.priorityBreakdown.score -
        a.priorityBreakdown.score;

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      // Older tickets win score ties.
      const ageDifference =
        a.createdAt.getTime() -
        b.createdAt.getTime();

      if (ageDifference !== 0) {
        return ageDifference;
      }

      // Final deterministic tie-breaker.
      return a.id.localeCompare(b.id);
    });
}
