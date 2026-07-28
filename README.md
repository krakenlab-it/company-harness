# KrakenLab Harness

The unified company operating system for **KrakenLab Media** — track projects, talk to Hermes (our AI assistant), delegate work to Cursor agents, watch stack health and cloud spend, manage CRM, and control team access.

## What you can do here

| Area | What it does |
|------|----------------|
| **Projects & Tickets** | Track sprints, goals, timelines, and feature work with a simple ticket board |
| **Hermes** | AI assistant (Groq) that knows your harness — ask about projects, costs, CRM, guidelines |
| **Agents** | Hand issues, PRs, and features to Cursor Cloud Agents |
| **Stack & Costs** | Auto-detect core deps (Next.js, Supabase, Stripe, OpenAI, trigger.dev, Resend, …) and enter monthly costs |
| **CRM** | Contacts and deals with Hermes insights |
| **Team** | Repos, allowed actions, and budgets |
| **Guidelines** | Preferred stack for future builds |

## Preferred stack (company default)

- **Next.js** + **Supabase** for apps
- **Redis** for heavy DB / cache reads
- **Gemini** for product AI; **Hermes (Groq)** for this harness
- **GCP** + **Terraform** for cloud/infra
- **Vercel** for hosting
- **trigger.dev** for background agents
- **OpenRouter** + **AI SDK** when an app needs flexible multi-model AI

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Demo data loads immediately — Hermes works offline without a key.

### Optional keys

| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | Full Hermes AI (without it, smart demo answers still work) |
| `CURSOR_API_KEY` | Live Cursor agent delegation (without it, jobs queue locally) |
| `HERMES_WEBHOOK_SECRET` | Protect the Hermes webhook channel |
| `NEXT_PUBLIC_SUPABASE_URL` / keys | Wire to Supabase when ready (SQL migration included) |

## Talk to Hermes

1. **In-app** — open **Hermes** in the sidebar and chat.
2. **Webhook** (Slack / Zapier / scripts) — `POST /api/hermes/webhook` with `{ "text": "What's our spend this month?" }`.

## Database

Supabase schema lives in `supabase/migrations/001_harness_schema.sql`. Until Supabase is connected, the app uses a full in-memory store with seed data (great for local demos and tests).

## Scripts

```bash
pnpm dev      # local app
pnpm build    # production build
pnpm test     # unit + API contract tests
pnpm lint     # eslint
```

## Architecture (short)

- Next.js App Router UI + API routes
- Hermes core agent (`src/lib/hermes`) using Groq via Vercel AI SDK
- Cursor client with local queue fallback (`src/lib/cursor`)
- Stack analyzer + cost rollups (`src/lib/stack`)
- Team / CRM / projects stored via memory store → ready for Supabase
