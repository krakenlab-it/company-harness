# KrakenLab Harness — Documentation

Complete reference for architecture, features, permissions, and walkthroughs.

| Document | What it covers |
|----------|----------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, services, data flow |
| [FEATURES.md](./FEATURES.md) | Every product feature by area |
| [HERMES.md](./HERMES.md) | Groq AI, tools, `@cursor` delegation, webhooks |
| [GITHUB_PERMISSIONS.md](./GITHUB_PERMISSIONS.md) | GitHub + Cursor permissions checklist |
| [DATABASE.md](./DATABASE.md) | Supabase schema, tables, relationships |
| [FRONTEND_FLOWS.md](./FRONTEND_FLOWS.md) | UI routes, ops loop, user journeys |

## Quick walkthrough (new team member)

1. **Clone & run** — see root [README.md](../README.md): `pnpm install`, copy `.env.example` → `.env.local`, `pnpm dev`.
2. **Sign in** — Supabase Google/email, or demo mode without auth.
3. **Observe** — Command Center (`/`) shows repos, tickets, agents, spend.
4. **Analyze** — Hermes (`/hermes`) answers questions via **Groq**; set `GROQ_API_KEY`.
5. **Act** — Admin/lead: `@cursor <task>` in Hermes or Agents page (`/agents`); set `CURSOR_API_KEY`.
6. **Audit** — Work (`/work`) for tickets/projects; delegation audit on Command Center.

## Environment checklist

| Variable | Required for |
|----------|----------------|
| `GROQ_API_KEY` | Live Hermes (Groq LLM) |
| `GROQ_MODEL` | Optional model override (default `openai/gpt-oss-120b`) |
| `CURSOR_API_KEY` | Live Cursor Cloud Agents |
| `GITHUB_TOKEN` + `GITHUB_ORG` | Repo sync & stack scan |
| Supabase keys | Production auth + Postgres |

See [GITHUB_PERMISSIONS.md](./GITHUB_PERMISSIONS.md) for token scopes.
