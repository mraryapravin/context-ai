
import {
  PRIORITY_WEIGHTS,
  rankTickets,
  type PriorityTicket,
  type PriorityWeights,
} from "../lib/tickets/priority-scoring";

import {
  ndcgAtK,
  criticalRecallAtK,
  type RelevanceLabel,
} from "../lib/tickets/ranking-metrics";

const NOW = new Date("2026-10-25T12:00:00.000Z");
const TOP_K = 10;
const HOUR_MS = 60 * 60 * 1000;

type LabelledTicket = PriorityTicket & {
  scenario: string;
  relevance: RelevanceLabel;
};

function makeCase(
  id: string,
  scenario: string,
  relevance: RelevanceLabel,
  priority: string,
  aiUrgency: string | null,
  aiEscalationRisk: string | null,
  hoursWaiting: number,
  lastAuthor: "CUSTOMER" | "STAFF" = "CUSTOMER"
): LabelledTicket {
  const createdAt = new Date(
    NOW.getTime() - hoursWaiting * HOUR_MS
  );

  return {
    id,
    scenario,
    relevance,
    status: "OPEN",
    priority,
    aiUrgency,
    aiEscalationRisk,
    createdAt,
    latestCustomerMessageAt: createdAt,
    latestMessageAuthorType: lastAuthor,
  };
}

// Illustrative scenarios with manually assigned relevance labels.
// The labels are independent of the scoring formula.
//
// 3 = Critical
// 2 = High
// 1 = Normal
// 0 = Low
//
// These are not real tickets or expert-validated labels.

const DATASET: LabelledTicket[] = [
  makeCase(
    "T01", "Production checkout unavailable for all customers",
    3, "HIGH", "HIGH", "HIGH", 2
  ),
  makeCase(
    "T02", "Possible account takeover and unauthorized access",
    3, "LOW", "LOW", "LOW", 1
  ),
  makeCase(
    "T03", "Payment system charging customers twice",
    3, "MEDIUM", "HIGH", "HIGH", 5
  ),
  makeCase(
    "T04", "Sensitive customer information exposed publicly",
    3, "HIGH", "HIGH", "HIGH", 0.5
  ),
  makeCase(
    "T05", "Entire business team locked out of their workspace",
    3, "MEDIUM", "HIGH", "MEDIUM", 12
  ),
  makeCase(
    "T06", "Data deletion appears to affect multiple accounts",
    3, "LOW", "MEDIUM", "HIGH", 20
  ),
  makeCase(
    "T07", "Monthly invoice contains incorrect amount",
    2, "MEDIUM", "MEDIUM", "MEDIUM", 18
  ),
  makeCase(
    "T08", "One user cannot access a paid feature",
    2, "HIGH", "MEDIUM", "MEDIUM", 8
  ),
  makeCase(
    "T09", "Important report export repeatedly fails",
    2, "MEDIUM", "MEDIUM", "LOW", 36
  ),
  makeCase(
    "T10", "Customer has not received a purchased service",
    2, "HIGH", "HIGH", "MEDIUM", 24
  ),
  makeCase(
    "T11", "Team integration fails after software update",
    2, "MEDIUM", "MEDIUM", "MEDIUM", 6
  ),
  makeCase(
    "T12", "Subscription cancellation is not processing",
    2, "LOW", "MEDIUM", "MEDIUM", 30
  ),
  makeCase(
    "T13", "Request to change profile display name",
    1, "LOW", "LOW", "LOW", 40
  ),
  makeCase(
    "T14", "Question about setting up notifications",
    1, "MEDIUM", "LOW", "LOW", 10
  ),
  makeCase(
    "T15", "Customer needs help finding an invoice",
    1, "LOW", "LOW", "LOW", 22
  ),
  makeCase(
    "T16", "Password reset request without security concerns",
    1, "MEDIUM", "MEDIUM", "LOW", 4
  ),
  makeCase(
    "T17", "Request to update billing contact details",
    1, "LOW", null, null, 26
  ),
  makeCase(
    "T18", "How to invite another team member",
    1, "MEDIUM", "LOW", "LOW", 14
  ),
  makeCase(
    "T19", "Minor spelling mistake on help page",
    0, "HIGH", "HIGH", "HIGH", 1
  ),
  makeCase(
    "T20", "Suggestion for a new dashboard colour",
    0, "LOW", "LOW", "LOW", 48
  ),
  makeCase(
    "T21", "General question about future product roadmap",
    0, "MEDIUM", "LOW", "LOW", 2
  ),
  makeCase(
    "T22", "Thank-you message after issue was solved",
    0, "LOW", "LOW", "LOW", 16, "STAFF"
  ),
  makeCase(
    "T23", "Request for a cosmetic icon change",
    0, "LOW", "LOW", "LOW", 3
  ),
  makeCase(
    "T24", "Non-urgent documentation formatting suggestion",
    0, "LOW", null, null, 44
  ),
];

function compareOlderFirst(
  a: LabelledTicket,
  b: LabelledTicket
): number {
  return (
    a.createdAt.getTime() - b.createdAt.getTime() ||
    a.id.localeCompare(b.id)
  );
}

function customerPriorityValue(priority: string): number {
  if (priority === "HIGH") return 3;
  if (priority === "MEDIUM") return 2;
  return 1;
}

function rankByCustomerPriority(
  tickets: LabelledTicket[]
): LabelledTicket[] {
  return [...tickets].sort((a, b) => {
    return (
      customerPriorityValue(b.priority) -
        customerPriorityValue(a.priority) ||
      compareOlderFirst(a, b)
    );
  });
}

function rankByOldestFirst(
  tickets: LabelledTicket[]
): LabelledTicket[] {
  return [...tickets].sort(compareOlderFirst);
}

// Remove one factor and renormalise the remaining
// weights so that they still sum to 1.
function weightsWithout(
  excluded: keyof PriorityWeights
): PriorityWeights {
  const remainingTotal =
    Object.entries(PRIORITY_WEIGHTS)
      .filter(([key]) => key !== excluded)
      .reduce((sum, [, value]) => sum + value, 0);

  return {
    urgency:
      excluded === "urgency"
        ? 0
        : PRIORITY_WEIGHTS.urgency / remainingTotal,
    escalation:
      excluded === "escalation"
        ? 0
        : PRIORITY_WEIGHTS.escalation / remainingTotal,
    customer:
      excluded === "customer"
        ? 0
        : PRIORITY_WEIGHTS.customer / remainingTotal,
    waiting:
      excluded === "waiting"
        ? 0
        : PRIORITY_WEIGHTS.waiting / remainingTotal,
  };
}

function evaluate(
  name: string,
  ranked: LabelledTicket[]
) {
  const ndcg = ndcgAtK(ranked, DATASET, TOP_K);
  const recall = criticalRecallAtK(
    ranked,
    DATASET,
    TOP_K
  );

  return {
    Method: name,
    "NDCG@10": ndcg.toFixed(4),
    "Critical Recall@10": `${(recall * 100).toFixed(1)}%`,
  };
}

function runEvaluation() {
  const ids = DATASET.map((ticket) => ticket.id);

  if (new Set(ids).size !== ids.length) {
    throw new Error("Duplicate ticket IDs in evaluation dataset.");
  }

  if (!DATASET.some((ticket) => ticket.relevance === 3)) {
    throw new Error("Evaluation dataset needs critical tickets.");
  }

  const fullRanking = rankTickets(DATASET, NOW);

  const methods = [
    evaluate("Weighted AI-assisted ranking", fullRanking),
    evaluate(
      "Baseline: customer priority",
      rankByCustomerPriority(DATASET)
    ),
    evaluate(
      "Baseline: oldest first",
      rankByOldestFirst(DATASET)
    ),
  ];

  const factors: Array<keyof PriorityWeights> = [
    "urgency",
    "escalation",
    "customer",
    "waiting",
  ];

  for (const factor of factors) {
    const weights = weightsWithout(factor);
    const ranked = rankTickets(DATASET, NOW, weights);

    methods.push(
      evaluate(`Ablation: remove ${factor}`, ranked)
    );
  }

  console.log("\nContext AI — Ranking Quality Evaluation");
  console.log("---------------------------------------");
  console.log(
    `Synthetic, manually labelled tickets: ${DATASET.length}`
  );
  console.log(
    `Critical tickets: ${
      DATASET.filter((ticket) => ticket.relevance === 3).length
    }`
  );
  console.log(`Evaluation cutoff: top ${TOP_K}`);
  console.log(
    "Labels are illustrative and have not been expert-validated.\n"
  );

  console.table(methods);

  console.log("\nFull model — top 10 recommendations:");
  console.table(
    fullRanking.slice(0, TOP_K).map((ticket, index) => ({
      Rank: index + 1,
      Ticket: ticket.id,
      Scenario: ticket.scenario,
      Relevance: ticket.relevance,
      Score: ticket.priorityBreakdown.score,
    }))
  );

  console.log("\nRelevance scale:");
  console.log("3 = Critical | 2 = High | 1 = Normal | 0 = Low");
}

runEvaluation();
