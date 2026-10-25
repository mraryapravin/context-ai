# Context AI

**An AI-powered customer-support platform with explainable ticket prioritisation, an AI Support Copilot and secure two-way messaging.**

Context AI is a full-stack web application built to help support teams manage customer requests, understand incoming issues and decide which tickets to handle first.

The platform combines LLM-generated ticket analysis with a deterministic, weighted ranking algorithm. It also supports authenticated staff workflows, secure customer conversations and persistent ticket management.

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Authentication | Auth.js, credentials authentication, bcrypt |
| AI | Groq API, `openai/gpt-oss-120b` |
| Validation | Zod |
| Testing | Vitest |
| Benchmarking | TypeScript, `tsx`, `performance.now()` |

## Features

### Customer Ticket Submission

Customers can submit support tickets through a public-facing form.

Each ticket includes customer-provided information, an issue description and a selected priority level.

Tickets are persisted in PostgreSQL and can be reviewed by authenticated support staff.

### Staff Dashboard and Ticket Inbox

Authenticated staff can access a dashboard, browse tickets and manage their status.

The ticket inbox includes:

- LOW, MEDIUM and HIGH customer-priority columns.
- Filtering by ticket status, customer priority and reply status.
- A recommended handling order showing the five highest-ranked active tickets.
- Numerical priority scores and component breakdowns.

Ticket statuses include `OPEN`, `IN_PROGRESS` and `RESOLVED`.

### AI Support Copilot

The AI Support Copilot analyses support tickets and provides staff with:

- A summary of the customer's issue.
- An urgency assessment.
- An escalation-risk assessment.
- Sentiment analysis.
- Supporting rationale.
- Recommended actions.
- Communication guidance.

AI output is intended to support human decision-making, not replace staff judgement.

The application includes fallback handling when AI analysis is unavailable.

### AI-Assisted Ticket Prioritisation

Context AI combines four signals to rank active tickets:

| Signal | Weight |
|---|---:|
| AI urgency | 45% |
| AI escalation risk | 25% |
| Customer-selected priority | 15% |
| Customer waiting time | 15% |

The ranking algorithm is deterministic and has **O(n log n)** overall time complexity.

Missing AI signals fall back to customer priority. Resolved tickets are excluded, and ties are broken consistently using ticket age and ID.

See [Ranking Algorithm](docs/priority-ranking.md) for the full implementation and design rationale.

### Secure Two-Way Messaging

Staff and customers can exchange messages within a ticket.

Staff access is protected by authentication. Customers receive a private ticket-access link containing a token, while the database stores a SHA-256 hash of that token.

Customer replies can reopen previously resolved tickets.

## Architecture

Context AI uses a full-stack Next.js architecture.

**Frontend:** React components provide ticket submission, staff inbox, ticket details and customer conversations.

**API layer:** Next.js Route Handlers process ticket creation, status updates and messages.

**Database layer:** Prisma communicates with a Neon-hosted PostgreSQL database.

**Authentication and authorisation:** Auth.js protects staff workflows, while customer ticket links provide token-based access to individual conversations.

**AI integration:** The Groq API generates ticket assessments and support guidance. The ranking algorithm then combines relevant AI signals with deterministic business rules.

The ranking stage does not require an additional LLM call.

## Performance Benchmarking

The in-memory ranking algorithm was benchmarked using synthetic ticket queues from 100 to 25,000 input tickets.

Each queue size was tested using 10 warm-up runs and 50 measured runs.

| Input tickets | Active tickets ranked | Median latency | p95 latency |
|---:|---:|---:|---:|
| 100 | 90 | 0.023 ms | 0.078 ms |
| 1,000 | 900 | 0.313 ms | 1.036 ms |
| 5,000 | 4,500 | 2.149 ms | 5.153 ms |
| 10,000 | 9,000 | **5.423 ms** | **10.495 ms** |
| 25,000 | 22,500 | 19.974 ms | 41.759 ms |

These measurements cover the **in-memory ranking function only**. They exclude database queries, LLM inference, HTTP requests and rendering.

See [Performance Benchmark Results](docs/benchmark-results.md) for methodology, full results and limitations.

## Ranking Quality Evaluation

Ranking quality was evaluated on **24 illustrative, manually labelled synthetic support-ticket scenarios**, including six critical cases.

The evaluation uses NDCG@10 and Critical Recall@10, comparing the weighted algorithm against simpler baselines.

| Ranking method | NDCG@10 | Critical Recall@10 |
|---|---:|---:|
| Weighted AI-assisted ranking | **0.8210** | **83.3%** |
| Customer-priority baseline | 0.5915 | 50.0% |
| Oldest-first baseline | 0.2830 | 16.7% |

Feature-ablation experiments also examine the effect of removing each scoring signal.

The evaluation identified important failure cases involving misleading upstream priority assessments.

**Important:** The dataset, AI signals and relevance labels are illustrative. These results do not establish real-world classification accuracy or production ranking effectiveness.

See [Ranking Quality Evaluation](docs/ranking-evaluation.md) for the full results, ablation study and limitations.

## Testing

The project includes **20 ranking-related unit tests**, covering:

- Weighted score calculations.
- AI-data fallbacks.
- Waiting-time behaviour.
- Ticket sorting and deterministic tie-breaking.
- Resolved-ticket exclusion.
- NDCG calculations.
- Critical-ticket recall.
- Evaluation edge cases.

Run the tests:

```bash
npx vitest run lib/tickets/priority-scoring.test.ts lib/tickets/ranking-metrics.test.ts
```

Run TypeScript checks:

```bash
npx tsc --noEmit
```

Run the production build:

```bash
npm run build
```

## Local Development

### Prerequisites

- Node.js and npm.
- A PostgreSQL database.
- A Groq API key.
- An Auth.js secret.

### Setup

Clone the repository:

```bash
git clone https://github.com/mraryapravin/context-ai.git
cd context-ai
```

Install dependencies:

```bash
npm install
```

Create a local `.env` file with the required environment variables:

```dotenv
DATABASE_URL="your-postgresql-connection-string"
AUTH_SECRET="your-auth-secret"
GROQ_API_KEY="your-groq-api-key"
```

Never commit real credentials or secrets.

Synchronise the Prisma schema and generate the client:

```bash
npx prisma db push
npx prisma generate
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

Staff authentication requires an appropriately configured staff account in the database.

## Reproducing the Experiments

Run the performance benchmark:

```bash
npx tsx benchmarks/priority-ranking.bench.ts
```

Run the ranking-quality evaluation:

```bash
npx tsx benchmarks/priority-ranking.evaluate.ts
```

The performance results depend on the local runtime and hardware. The ranking-quality experiment uses a fixed synthetic dataset for reproducibility.

## Technical Documentation

- [Ranking Algorithm and Design Decisions](docs/priority-ranking.md)
- [Performance Benchmark Results](docs/benchmark-results.md)
- [Ranking Quality Evaluation](docs/ranking-evaluation.md)

## Limitations and Future Work

Context AI is a portfolio project and has not been validated against a representative production customer-support dataset.

Areas for future development include:

- Evaluation with real, independently labelled support tickets.
- Calibration of AI classifications and ranking weights.
- Improved handling of security-critical false negatives.
- SLA-aware prioritisation.
- Database-side filtering and pagination for large queues.
- End-to-end API performance and concurrency testing.
- Expanded integration and security testing.
- Production deployment and operational monitoring.

## Project Purpose

Context AI was developed as a practical full-stack software engineering project exploring how LLM-assisted analysis can be combined with traditional application architecture, deterministic algorithms, authentication, database persistence and measurable evaluation.

The goal is to make AI assistance useful, explainable and testable within a realistic customer-support workflow.