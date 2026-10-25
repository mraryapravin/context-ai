# AI-Assisted Ticket Prioritisation

## Overview

Context AI uses a deterministic, weighted scoring algorithm to recommend which customer-support tickets staff should handle first.

The system combines AI-generated ticket assessments with customer-selected priority and the time a customer has been waiting for a response.

Rather than allowing an LLM to decide the final ordering directly, Context AI calculates an explainable numerical score for each ticket and sorts tickets by that score.

The staff inbox displays the five highest-ranked active tickets in its **Recommended Handling Order** section.

## Scoring Formula

Each active ticket receives a score calculated using:

\[
S = 0.45U + 0.25E + 0.15C + 0.15W
\]

Where:

| Component | Weight | Description |
|---|---:|---|
| U — AI urgency | 45% | AI assessment of how urgently the ticket needs attention |
| E — AI escalation risk | 25% | AI assessment of the risk of the issue escalating |
| C — Customer priority | 15% | Priority selected by the customer when submitting the ticket |
| W — Waiting time | 15% | Time since the customer began waiting for staff attention |

Urgency, escalation risk and customer priority use the following numerical mapping:

| Level | Score |
|---|---:|
| LOW | 20 |
| MEDIUM | 60 |
| HIGH | 100 |

The final weighted score is rounded to two decimal places.

These weights are engineering choices rather than learned or statistically optimised parameters.

## Waiting-Time Calculation

The waiting-time score increases linearly from 0 to 100 over 48 hours.

\[
W = \min(100, \max(0, h) / 48 \times 100)
\]

Here, \(h\) represents the number of hours elapsed since the latest customer message, or since ticket creation when no customer message is available.

If the latest message was sent by staff, the waiting-time score is set to zero.

Waiting time is capped at 100, and future timestamps cannot generate negative waiting scores.

## Missing AI Data

If AI urgency or escalation risk is unavailable or invalid, the algorithm substitutes the customer-priority score for that missing component.

This allows ticket ranking to continue when AI analysis fails or returns incomplete data.

The ranking breakdown also records whether either AI signal was missing.

This fallback improves resilience, but it does not guarantee that the resulting ranking is accurate.

## Ranking Behaviour

The `rankTickets()` function:

1. Excludes tickets with status `RESOLVED`.
2. Calculates the weighted priority score for each remaining ticket.
3. Sorts tickets by score, highest first.
4. Breaks equal-score ties using ticket creation time, oldest first.
5. Uses the ticket ID as a final deterministic tie-breaker.

The scoring algorithm does not change ticket statuses or automatically resolve issues. Staff remain responsible for reviewing tickets and taking action.

## Computational Complexity

For \(n\) input tickets:

- Filtering active tickets takes \(O(n)\).
- Calculating priority scores takes \(O(n)\).
- Sorting takes \(O(n \log n)\) in the general case.

The overall time complexity is therefore **\(O(n \log n)\)**.

The implementation creates a new array of ranked ticket objects, requiring \(O(n)\) additional space, excluding sorting implementation details.

## Design Decisions

### Why use weighted scoring instead of asking an LLM to rank everything?

Weighted scoring provides deterministic, reproducible results given the same inputs, weights and evaluation time.

It also makes the relative contribution of each signal visible to staff and allows the ranking step to run without an additional LLM call.

However, ranking quality still depends on the quality of the upstream AI-generated urgency and escalation-risk labels.

### Why include waiting time?

Waiting time prevents ticket prioritisation from relying exclusively on issue severity. As a customer waits longer, their ticket receives an increasing waiting-time contribution.

The current implementation uses a linear increase over 48 hours. Other approaches, such as nonlinear aging or service-level agreement thresholds, could be explored in future work.

### Why use deterministic tie-breaking?

Sorting by creation time and then ticket ID makes equal-score rankings predictable and reproducible.

### Why support configurable weights?

The default weights remain unchanged during normal application use.

Optional weight configurations allow controlled experiments, including feature ablation, without modifying the production defaults.

## Limitations and Future Improvements

- The weights were selected manually and have not been validated using real customer-support outcomes.
- Incorrect AI classifications can cause serious misrankings.
- Customer-selected priority may not reliably reflect actual issue severity.
- The waiting-time model does not currently incorporate contractual SLAs or business-specific deadlines.
- Scores are calculated during ranking rather than stored or incrementally maintained.
- The implementation ranks an in-memory ticket collection, which may require redesign for very large queues.
- Human review remains necessary, particularly for security, privacy and other high-impact incidents.

## Implementation

- `lib/tickets/priority-scoring.ts` — scoring and ranking logic.
- `lib/tickets/priority-scoring.test.ts` — scoring and ranking unit tests.
- `lib/tickets/ranking-metrics.ts` — ranking-quality evaluation metrics.
- `lib/tickets/ranking-metrics.test.ts` — metric unit tests.
- `benchmarks/priority-ranking.bench.ts` — performance benchmark.
- `benchmarks/priority-ranking.evaluate.ts` — synthetic ranking-quality evaluation.

## Verification

Run the ranking-related unit tests:

```bash
npx vitest run lib/tickets/priority-scoring.test.ts lib/tickets/ranking-metrics.test.ts
```

Run the performance benchmark:

```bash
npx tsx benchmarks/priority-ranking.bench.ts
```

Run the ranking-quality evaluation:

```bash
npx tsx benchmarks/priority-ranking.evaluate.ts
```

The evaluation and performance methodology, results and limitations should be considered alongside this algorithm description.