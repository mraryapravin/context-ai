# Ticket Ranking — Performance Benchmark

## Overview

This benchmark measures the execution time of Context AI's AI-assisted ticket-ranking algorithm as the number of input tickets increases.

The objective is to assess the computational performance of the deterministic ranking stage, independently of database queries, network requests and LLM inference.

The benchmark calls the same `rankTickets()` function used by the application.

## Benchmark Methodology

The benchmark generates synthetic ticket queues of five sizes:

- 100 tickets
- 1,000 tickets
- 5,000 tickets
- 10,000 tickets
- 25,000 tickets

Each synthetic ticket includes its status, customer priority, AI urgency, AI escalation risk, creation time and latest-message author.

The generated dataset includes varying priorities, some missing AI classifications and tickets that have already received staff replies.

For every ten generated tickets, one is marked `RESOLVED`. Resolved tickets are excluded from ranking, so approximately 90% of input tickets are ranked.

This 10% resolved-ticket proportion is a synthetic benchmark assumption, not an estimate of actual customer-support workloads.

### Measurement Procedure

For each queue size:

1. Generate the synthetic ticket dataset.
2. Execute 10 warm-up ranking runs.
3. Execute 50 measured ranking runs.
4. Measure elapsed execution time using `performance.now()`.
5. Calculate the mean, median, 95th percentile (p95), minimum and maximum latency.

All ranking runs use the same fixed reference timestamp to make time-dependent priority scores reproducible.

## Measured Results

The following results were obtained from a local benchmark run on 25 October 2026.

| Input tickets | Active tickets ranked | Mean (ms) | Median (ms) | p95 (ms) | Minimum (ms) | Maximum (ms) |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 90 | 0.047 | 0.023 | 0.078 | 0.022 | 0.571 |
| 1,000 | 900 | 0.432 | 0.313 | 1.036 | 0.278 | 1.458 |
| 5,000 | 4,500 | 2.560 | 2.149 | 5.153 | 1.693 | 6.583 |
| 10,000 | 9,000 | 6.131 | 5.423 | 10.495 | 3.912 | 11.404 |
| 25,000 | 22,500 | 23.432 | 19.974 | 41.759 | 16.153 | 48.285 |

All measurements are in milliseconds.

## Key Observations

### Ranking 10,000 Input Tickets

For a synthetic queue containing 10,000 tickets, of which 9,000 were active:

- Median execution time: **5.423 ms**
- Mean execution time: **6.131 ms**
- p95 execution time: **10.495 ms**

This demonstrates that the in-memory ranking stage can process this synthetic workload within a few milliseconds on the tested machine.

It does not establish the response time of the complete application.

### Ranking 25,000 Input Tickets

For 25,000 input tickets, of which 22,500 were active:

- Median execution time: **19.974 ms**
- Mean execution time: **23.432 ms**
- p95 execution time: **41.759 ms**

The measured latency increased as queue size increased, as expected for a ranking algorithm that sorts its results.

### Algorithmic Complexity

The ranking implementation filters tickets, calculates weighted scores and sorts the active tickets.

Filtering and scoring each take linear time, while comparison-based sorting takes \(O(n \log n)\) time in the general case.

The overall time complexity is therefore **\(O(n \log n)\)**.

The measurements are consistent with increasing computational work as queue size grows, but five benchmark sizes are not sufficient to empirically prove the asymptotic complexity.

## Reproducing the Benchmark

From the repository root, run:

```bash
npx tsx benchmarks/priority-ranking.bench.ts
```

The benchmark prints a table containing the queue size, active tickets ranked and latency statistics.

Results may differ across machines, operating systems, Node.js versions and background system workloads.

## Limitations

### In-Memory Execution Only

The benchmark measures the ranking function, not an end-to-end HTTP request.

It excludes:

- PostgreSQL query latency.
- Prisma data retrieval and object construction.
- Authentication and session validation.
- Groq API requests and LLM inference.
- Next.js server rendering.
- Network latency and browser rendering.

Therefore, the measured times must not be described as complete ticket-inbox response times.

### Synthetic Dataset

The generated tickets use deterministic, repeating patterns rather than real customer-support records.

The distribution of priorities, missing AI signals, statuses and waiting times may not represent production workloads.

### Hardware and Runtime

These measurements come from a single local run. The benchmark output did not record the CPU model, Node.js version or detailed hardware specifications.

Without that information, the results cannot be directly compared with measurements from other environments.

### No Concurrency or Load Testing

The benchmark measures individual in-memory ranking executions.

It does not evaluate concurrent users, database contention, server throughput, memory pressure under load or sustained production traffic.

### No Ranking-Quality Measurement

A fast ranking algorithm is not necessarily a good ranking algorithm.

Ranking quality is evaluated separately using NDCG@10, Critical Recall@10, baseline comparisons and feature-ablation experiments.

See `docs/ranking-evaluation.md` for the ranking-quality methodology and findings once available.

## Future Work

Potential improvements include:

- Measuring end-to-end inbox response times.
- Profiling database query latency separately from ranking latency.
- Repeating benchmarks across multiple machines and runtime versions.
- Recording memory usage alongside execution time.
- Testing concurrent requests and larger datasets.
- Exploring database-side filtering, pagination or incremental ranking for very large queues.

## Source Code

- `lib/tickets/priority-scoring.ts` — ranking implementation.
- `benchmarks/priority-ranking.bench.ts` — benchmark runner.
- `lib/tickets/priority-scoring.test.ts` — ranking unit tests.