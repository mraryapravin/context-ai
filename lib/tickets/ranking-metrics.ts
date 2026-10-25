
export type RelevanceLabel = 0 | 1 | 2 | 3;

export type EvaluatedTicket = {
  id: string;
  relevance: RelevanceLabel;
};

// DCG rewards relevant tickets near the top.
// Higher positions receive a larger discount.
function discountedGain(
  tickets: EvaluatedTicket[],
  k: number
): number {
  return tickets
    .slice(0, k)
    .reduce((total, ticket, index) => {
      const gain = 2 ** ticket.relevance - 1;
      const discount = Math.log2(index + 2);

      return total + gain / discount;
    }, 0);
}

// NDCG compares our ranking against the best possible
// ordering for the independently assigned labels.
export function ndcgAtK(
  ranked: EvaluatedTicket[],
  allTickets: EvaluatedTicket[],
  k: number
): number {
  const ideal = [...allTickets].sort(
    (a, b) => b.relevance - a.relevance
  );

  const idealGain = discountedGain(ideal, k);

  if (idealGain === 0) {
    return 0;
  }

  return discountedGain(ranked, k) / idealGain;
}

// Critical recall measures the proportion of all
// critical tickets appearing within the top k.
export function criticalRecallAtK(
  ranked: EvaluatedTicket[],
  allTickets: EvaluatedTicket[],
  k: number
): number {
  const criticalIds = new Set(
    allTickets
      .filter((ticket) => ticket.relevance === 3)
      .map((ticket) => ticket.id)
  );

  if (criticalIds.size === 0) {
    return 0;
  }

  const found = ranked
    .slice(0, k)
    .filter((ticket) => criticalIds.has(ticket.id))
    .length;

  return found / criticalIds.size;
}
