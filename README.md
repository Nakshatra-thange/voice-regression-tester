# Voice Regression Lab

A regression-testing framework for voice AI agents — think "Playwright/Jest snapshot testing," but for phone conversations.

## The problem

Voice agents change constantly — prompt tweaks, new tools, model swaps, new business verticals — and every change can silently break behavior that used to work. Conversations are non-deterministic, so you can't diff text output the way you'd diff a JSON API response. Most teams still catch regressions by manually calling the agent and listening. This doesn't scale, and it means bugs ship to production.

## What this does

Define a test case — a caller persona (scripted or goal-driven) plus a set of pass/fail assertions — run it against any agent (your own, or a real one over the phone), and get a pass/fail report with a full transcript, diffed against the last known-good baseline. Point it at your agent in CI on every prompt change and get an actual signal instead of vibes.

This is infrastructure *around* a voice agent, not a voice agent itself — no conversational intelligence is implemented here.

## Architecture

```mermaid
flowchart LR
    TC[TestCase] --> CS[CallerSimulator]
    CS -->|scripted / goal-driven| CR[ConversationRunner]
    CR <--> AA[AgentAdapter]
    AA -->|HTTP| AGENT[Agent under test]
    AA -.->|Twilio + TTS/STT| PHONE[Real phone call]
    CR --> RES[ConversationResult]
    RES --> AE[Assertion Engine]
    AE --> DB[(Postgres / Neon)]
    DB --> DIFF[Baseline Diff]
    DB --> DASH[Next.js Dashboard]
    Q[BullMQ Queue + Worker] -.orchestrates concurrency.-> CR
```

- **Adapter layer** — abstracts "send a turn, get a reply" over any agent (your own reference agents, or a generic-JSON adapter for third-party APIs).
- **Caller simulation** — scripted (deterministic) or goal-driven (an LLM plays a persona reactively).
- **Assertion engine** — keyword/regex/tool-call/latency/turn-count checks, plus an optional LLM-judge for fuzzy criteria.
- **Baselines & diffing** — every run is stored; one run per (test case, agent) is flagged as baseline; new runs diff against it turn-by-turn.
- **Queue** — BullMQ + Redis fan out a whole suite with real concurrency, retries, and timeouts.
- **Dashboard** — Next.js, reads straight from Postgres via server components.
- **CI** — a CLI that exits non-zero on failure, wired into a GitHub Action that comments pass/fail on every PR.
- **Phone layer** — optional: places a real call via Twilio, speaks via ElevenLabs TTS, transcribes the agent's replies via Deepgram STT, and feeds the same assertion engine.

## Tech stack

Node.js, TypeScript, Next.js (App Router), Prisma ORM v7, Postgres (Neon, serverless driver adapter), BullMQ + Redis, Anthropic API (reference agents + goal-driven caller + LLM-judge assertions), Twilio + Deepgram + ElevenLabs (phone layer), Tailwind v4 + Recharts (dashboard).

## Prerequisites

- Node ≥ 20.19 (22.x recommended)
- A [Neon](https://neon.tech) Postgres project (free tier is fine)
- An Anthropic API key
- Redis (local Docker, or a free [Upstash](https://upstash.com) instance)
- Optional, for the phone layer: Twilio, Deepgram, ElevenLabs accounts + `ngrok`

## Setup

```bash
git clone <your-repo-url>
cd voice-regression-tester
npm install
cp .env.example .env   # then fill in the values below
npx prisma generate
npx prisma migrate dev
```

### `.env`

```bash
# Neon — pooled (app runtime) + direct (migrations)
DATABASE_URL="postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require&connect_timeout=15"
DIRECT_URL="postgresql://user:pass@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require&connect_timeout=15"

# Anthropic — powers the reference agent, the goal-driven caller, and the LLM-judge assertion
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-5

# Queue
REDIS_URL=redis://localhost:6379

# --- Optional: Phase 9 phone layer ---
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
DEEPGRAM_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
PUBLIC_SERVER_URL=
TARGET_AGENT_PHONE_NUMBER=
```

## Running it

```bash
npm run seed          # creates the reference agent + 4 sample test cases
npm run dev:all        # reference agent (4001) + worker + dashboard (3000), all at once
```

Open **http://localhost:3000**.

```bash
# in another terminal — run the whole suite through the queue
npm run test:voice -- --version v1.0.0 --tag booking

# first run has no baseline yet — promote it
npm run promote-baselines
```

Refresh the dashboard — you'll see pass/fail status, latency charts, and full transcripts per run.

**To see a regression get caught:** open `src/reference-agents/booking-agent.ts`, delete the "Never quote prices" line from `SYSTEM_PROMPT`, restart the agent, then run the suite again with a new version tag. The "never quote prices" test case flips to ❌, and the run-detail page highlights exactly which transcript turn changed against the baseline.

```bash
npm run test:voice -- --version v1.0.1 --tag booking
```

## CI

Push to GitHub, add `DATABASE_URL`, `DIRECT_URL`, and `ANTHROPIC_API_KEY` as repo secrets, and every pull request gets an automatic pass/fail comment via `.github/workflows/voice-regression.yml`.

## Project structure

See [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) *(or inline in this README — see the architecture section above for the phase-by-phase folder breakdown)*.

## Status / what's next

Built as an exploration project, not a finished product. Known gaps: no baseline-promotion UI (CLI only), single reference agent, LLM-judge assertions aren't yet exercised in the seed data, and the phone layer hasn't been load-tested for concurrent calls.
