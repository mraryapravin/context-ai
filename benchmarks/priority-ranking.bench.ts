
import { performance } from "node:perf_hooks";
import {
  rankTickets,
  type PriorityTicket,
} from "../lib/tickets/priority-scoring";

const NOW = new Date("2026-10-25T12:00:00.000Z");

const QUEUE_SIZES = [100, 1_000, 5_000, 10_000, 25_000];

const WARMUP_RUNS = 10;
const MEASURED_RUNS = 50;

const LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;

function makeTickets(count: number): PriorityTicket[] {
  const tickets: PriorityTicket[] = [];

  for (let i = 0; i < count; i++) {
    const createdAt = new Date(
      NOW.getTime() - (i % 96) * 60 * 60 * 1000
    );

    tickets.push({
      id: `ticket-${i}`,
      status: i % 10 === 0 ? "RESOLVED" : "OPEN",
      priority: LEVELS[i % 3],
      aiUrgency: i % 17 === 0 ? null : LEVELS[(i * 7) % 3],
      aiEscalationRisk:
        i % 19 === 0 ? null : LEVELS[(i * 11) % 3],
      createdAt,
      latestCustomerMessageAt: null,
      latestMessageAuthorType:
        i % 4 === 0 ? "STAFF" : "CUSTOMER",
    });
  }

  return tickets;
}

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * fraction) - 1;

  return sorted[Math.max(0, index)];
}

function benchmark(count: number) {
  const tickets = makeTickets(count);

  // Warm up the JavaScript engine before measuring.
  for (let i = 0; i < WARMUP_RUNS; i++) {
    rankTickets(tickets, NOW);
  }

  const times: number[] = [];
  let rankedCount = 0;

  for (let i = 0; i < MEASURED_RUNS; i++) {
    const start = performance.now();

    const ranked = rankTickets(tickets, NOW);

    const end = performance.now();

    rankedCount = ranked.length;
    times.push(end - start);
  }

  const total = times.reduce((sum, time) => sum + time, 0);

  return {
    inputTickets: count,
    rankedTickets: rankedCount,
    meanMs: total / times.length,
    medianMs: percentile(times, 0.5),
    p95Ms: percentile(times, 0.95),
    minMs: Math.min(...times),
    maxMs: Math.max(...times),
  };
}

console.log("\nContext AI — Ticket Ranking Benchmark");
console.log("-------------------------------------");
console.log(`Warm-up runs: ${WARMUP_RUNS}`);
console.log(`Measured runs: ${MEASURED_RUNS}`);
console.log("All timings in milliseconds.\n");

const results = QUEUE_SIZES.map(benchmark);

console.table(
  results.map((result) => ({
    Tickets: result.inputTickets,
    Ranked: result.rankedTickets,
    "Mean (ms)": result.meanMs.toFixed(3),
    "Median (ms)": result.medianMs.toFixed(3),
    "p95 (ms)": result.p95Ms.toFixed(3),
    "Min (ms)": result.minMs.toFixed(3),
    "Max (ms)": result.maxMs.toFixed(3),
  }))
);
