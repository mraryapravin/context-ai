
import { describe, expect, it } from "vitest";

import {
  calculatePriorityScore,
  rankTickets,
  type PriorityTicket,
} from "./priority-scoring";

// A fixed clock makes every test reproducible.
const NOW = new Date("2026-10-25T12:00:00.000Z");

// A reusable example ticket.
// Each test changes only the properties it needs.
function makeTicket(
  overrides: Partial<PriorityTicket> = {}
): PriorityTicket {
  return {
    id: "ticket-1",
    status: "OPEN",
    priority: "MEDIUM",
    aiUrgency: "MEDIUM",
    aiEscalationRisk: "MEDIUM",
    createdAt: new Date("2026-10-25T10:00:00.000Z"),
    latestCustomerMessageAt: null,
    latestMessageAuthorType: null,
    ...overrides,
  };
}

describe("calculatePriorityScore", () => {
  it("calculates the weighted score correctly", () => {
    const ticket = makeTicket({
      aiUrgency: "HIGH",
      aiEscalationRisk: "HIGH",
      priority: "LOW",
      createdAt: new Date("2026-10-24T12:00:00.000Z"),
    });

    const result = calculatePriorityScore(ticket, NOW);

    // U=100, E=100, C=20, W=50
    // 0.45(100) + 0.25(100) + 0.15(20) + 0.15(50)
    expect(result.score).toBe(80.5);
    expect(result.missingAiData).toBe(false);
  });

  it("gives higher urgency a higher score", () => {
    const low = calculatePriorityScore(
      makeTicket({ aiUrgency: "LOW" }),
      NOW
    );

    const high = calculatePriorityScore(
      makeTicket({ aiUrgency: "HIGH" }),
      NOW
    );

    expect(high.score).toBeGreaterThan(low.score);
  });

  it("increases priority as a customer waits longer", () => {
    const recent = calculatePriorityScore(
      makeTicket({
        createdAt: new Date("2026-10-25T11:00:00.000Z"),
      }),
      NOW
    );

    const older = calculatePriorityScore(
      makeTicket({
        createdAt: new Date("2026-10-24T12:00:00.000Z"),
      }),
      NOW
    );

    expect(older.waitingScore).toBeGreaterThan(
      recent.waitingScore
    );

    expect(older.score).toBeGreaterThan(recent.score);
  });

  it("uses customer priority when AI data is missing", () => {
    const result = calculatePriorityScore(
      makeTicket({
        priority: "HIGH",
        aiUrgency: null,
        aiEscalationRisk: null,
      }),
      NOW
    );

    expect(result.missingAiData).toBe(true);
    expect(result.urgencyScore).toBe(100);
    expect(result.escalationScore).toBe(100);
    expect(Number.isFinite(result.score)).toBe(true);
  });

  it("does not accumulate waiting time after a staff reply", () => {
    const result = calculatePriorityScore(
      makeTicket({
        latestMessageAuthorType: "STAFF",
        createdAt: new Date("2026-10-20T12:00:00.000Z"),
      }),
      NOW
    );

    expect(result.waitingScore).toBe(0);
  });

  it("caps waiting time at 100", () => {
    const result = calculatePriorityScore(
      makeTicket({
        createdAt: new Date("2026-10-01T12:00:00.000Z"),
      }),
      NOW
    );

    expect(result.waitingScore).toBe(100);
  });

  it("does not award waiting time for future timestamps", () => {
    const result = calculatePriorityScore(
      makeTicket({
        createdAt: new Date("2026-10-26T12:00:00.000Z"),
      }),
      NOW
    );

    expect(result.waitingScore).toBe(0);
  });
});

describe("rankTickets", () => {
  it("sorts tickets from highest score to lowest", () => {
    const tickets = [
      makeTicket({
        id: "low",
        aiUrgency: "LOW",
      }),
      makeTicket({
        id: "high",
        aiUrgency: "HIGH",
      }),
      makeTicket({
        id: "medium",
        aiUrgency: "MEDIUM",
      }),
    ];

    const ranked = rankTickets(tickets, NOW);

    expect(ranked.map((ticket) => ticket.id)).toEqual([
      "high",
      "medium",
      "low",
    ]);
  });

  it("excludes resolved tickets", () => {
    const tickets = [
      makeTicket({
        id: "resolved",
        status: "RESOLVED",
        aiUrgency: "HIGH",
      }),
      makeTicket({
        id: "open",
        status: "OPEN",
        aiUrgency: "LOW",
      }),
    ];

    const ranked = rankTickets(tickets, NOW);

    expect(ranked.map((ticket) => ticket.id)).toEqual([
      "open",
    ]);
  });

  it("uses older creation dates to break score ties", () => {
    const tickets = [
      makeTicket({
        id: "newer",
        createdAt: new Date("2026-10-24T12:00:00.000Z"),
      }),
      makeTicket({
        id: "older",
        createdAt: new Date("2026-10-23T12:00:00.000Z"),
      }),
    ];

    // Both tickets have reached the waiting-time cap,
    // so their weighted scores are equal.
    const ranked = rankTickets(tickets, NOW);

    expect(ranked.map((ticket) => ticket.id)).toEqual([
      "older",
      "newer",
    ]);
  });
});
