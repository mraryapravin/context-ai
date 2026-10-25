
import { describe, expect, it } from "vitest";

import {
  ndcgAtK,
  criticalRecallAtK,
  type EvaluatedTicket,
} from "./ranking-metrics";

const tickets: EvaluatedTicket[] = [
  { id: "A", relevance: 3 },
  { id: "B", relevance: 2 },
  { id: "C", relevance: 1 },
  { id: "D", relevance: 0 },
];

describe("ndcgAtK", () => {
  it("returns 1 for a perfect ranking", () => {
    expect(ndcgAtK(tickets, tickets, 4)).toBeCloseTo(1);
  });

  it("penalises putting less relevant tickets first", () => {
    const poorRanking = [
      tickets[3],
      tickets[2],
      tickets[1],
      tickets[0],
    ];

    expect(ndcgAtK(poorRanking, tickets, 4)).toBeLessThan(1);
  });

  it("matches a manually calculated NDCG value", () => {
    const ranked = [
      tickets[2], // Relevance 1
      tickets[0], // Relevance 3
      tickets[1], // Relevance 2
      tickets[3], // Relevance 0
    ];

    // At k=2:
    // Actual DCG = 1 + 7/log2(3)
    // Ideal DCG  = 7 + 3/log2(3)
    const expected =
      (1 + 7 / Math.log2(3)) /
      (7 + 3 / Math.log2(3));

    expect(ndcgAtK(ranked, tickets, 2)).toBeCloseTo(
      expected,
      10
    );
  });

  it("returns 0 when all relevance labels are zero", () => {
    const irrelevant: EvaluatedTicket[] = [
      { id: "X", relevance: 0 },
      { id: "Y", relevance: 0 },
    ];

    expect(ndcgAtK(irrelevant, irrelevant, 2)).toBe(0);
  });

  it("does not modify the original dataset", () => {
    const originalIds = tickets.map((ticket) => ticket.id);

    ndcgAtK([...tickets].reverse(), tickets, 4);

    expect(tickets.map((ticket) => ticket.id)).toEqual(
      originalIds
    );
  });
});

describe("criticalRecallAtK", () => {
  const dataset: EvaluatedTicket[] = [
    { id: "A", relevance: 3 },
    { id: "B", relevance: 3 },
    { id: "C", relevance: 2 },
    { id: "D", relevance: 0 },
  ];

  it("returns 1 when all critical tickets are found", () => {
    expect(
      criticalRecallAtK(dataset, dataset, 4)
    ).toBe(1);
  });

  it("returns 0.5 when one of two critical tickets is found", () => {
    const ranked = [
      dataset[0],
      dataset[2],
      dataset[1],
      dataset[3],
    ];

    expect(
      criticalRecallAtK(ranked, dataset, 2)
    ).toBe(0.5);
  });

  it("returns 0 when no critical tickets are in the top k", () => {
    const ranked = [
      dataset[3],
      dataset[2],
      dataset[0],
      dataset[1],
    ];

    expect(
      criticalRecallAtK(ranked, dataset, 2)
    ).toBe(0);
  });

  it("returns 0 when the dataset has no critical tickets", () => {
    const noCritical: EvaluatedTicket[] = [
      { id: "X", relevance: 1 },
      { id: "Y", relevance: 2 },
    ];

    expect(
      criticalRecallAtK(noCritical, noCritical, 2)
    ).toBe(0);
  });

  it("respects the top-k cutoff", () => {
    const ranked = [
      dataset[2],
      dataset[0],
      dataset[1],
      dataset[3],
    ];

    expect(
      criticalRecallAtK(ranked, dataset, 1)
    ).toBe(0);

    expect(
      criticalRecallAtK(ranked, dataset, 3)
    ).toBe(1);
  });
});
