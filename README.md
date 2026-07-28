# KrakenLab Harness

The unified company operating system for **KrakenLab Media** — multi-repo command center, Hermes AI assistant (read context + tickets), admin-controlled Cursor delegation, stack health, and team access.

## V1 focus

| Capability | What you get |
|------------|----------------|
| **Auth & permissions** | Supabase sessions (or demo mode); every API scoped to role + repo access |
| **Command Center** | Dense multi-repo table: stack, tickets, agents, spend, connector status |
| **Repos & stack** | Per-repo GitHub `package.json` scan and dependency table |
| **Hermes** | Context from repos, costs, tickets, agent jobs — **cannot** delegate Cursor |
| **Agents** | Admin/lead only; requires `agents` repo permission; always-new-PR policy |
| **Work** | Projects, tickets, sprint Gantt timeline |
| **Team & Access** | Member × repo permission matrix; Resend invites |

**Hidden from V1 nav (code retained):** CRM, Guidelines, legacy dashboard routes.

### Demo mode

Without Supabase configured, set `HARNESS_DEMO_MODE=true` in `.env.local` (default). You get an admin demo session and open APIs for local development.

With Supabase configured, middleware protects all harness pages and APIs except login, join, invite accept, and Hermes webhook.

## What you can do here

| Area | What it does |
|------|----------------|
| **Command Center** | Multi-repo stats, connector strip, agent job visibility |
| **Repos** | Stack scan from GitHub, repo detail tables |
| **Work** | Projects, tickets, sprint Gantt |
| **Hermes** | AI assistant (Groq) — projects, costs, tickets, repo context |
| **Agents** | Hand features, bugfixes, merge conflicts to Cursor (admin/lead) |
| **Connect** | OpenRouter, Trigger.dev, Google, GCP, GitHub sync |
| **Team & Access** | Invites, member repo matrix, budgets |

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
| `NEXT_PUBLIC_SUPABASE_URL` / keys | Auth + Postgres (migrations 001–003) |
| `HARNESS_DEMO_MODE` | `true` = demo admin session without Supabase (default when Supabase unset) |
| `OPENROUTER_API_KEY` | Live token usage + spend sync |
| `TRIGGER_SECRET_KEY` | Trigger.dev runs and estimated spend |
| `GITHUB_TOKEN` / `GITHUB_ORG` | Sync real GitHub repos to projects |
| `GOOGLE_CLIENT_ID` / `SECRET` | Gmail + Calendar OAuth |
| `GCP_PROJECT_ID` + service account JSON | GCP billing + Cloud Run health |
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | Team invite emails with join links |

## Integrations

Open **Integrations** in the sidebar (or visit `/integrations`) to connect services. Add keys to `.env.local`, then **Sync now** per provider or **Sync all configured**.

| Service | What syncs |
|---------|------------|
| **OpenRouter** | Usage USD, limits → Stack & Costs |
| **Trigger.dev** | Recent runs, estimated compute spend |
| **Google** | OAuth connect → Gmail threads + Calendar events |
| **GCP** | Cloud Run health + configured monthly spend |
| **GitHub** | Org/user repos, auto-link to harness projects by `repoUrl` |
| **Resend** | Sends invite emails from Team → Invite teammate |

### Team invite flow

1. **Team** → **Invite teammate** — pick email, role, and projects.
2. Resend sends an email (or copy the join link in dev without Resend).
3. Invitee opens `/join?token=…` → sign in (Supabase Google/email) or accept in demo mode.
4. Accept creates the team member and project assignments.

SQL migrations:

- `supabase/migrations/001_harness_schema.sql` — core schema
- `supabase/migrations/002_integrations_invites_auth.sql` — integrations + invites
- `supabase/migrations/003_v1_permissions.sql` — repo_access, delegation_audit, Gantt dates

## Database

Supabase schema lives in `supabase/migrations/`. Until Supabase is connected, the app uses a full in-memory store with seed data (great for local demos and tests).

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
