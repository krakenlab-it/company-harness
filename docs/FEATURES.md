# Features reference

Every major harness capability, where it lives, and who can use it.

## Command Center (Observe)

**Route:** `/`  
**API:** `GET /api/command-center`

| Feature | Description |
|---------|-------------|
| Multi-repo table | Entities, stack count, tickets, agents, spend, health |
| Metric tiles | Totals across visible repos |
| Connector strip | Integration feed status (OpenRouter, GitHub, …) |
| Intel / Act links | Per-row handoff to Hermes / Agents with `?repo=` |
| Mission queue | Recent Cursor agent jobs |
| Audit trail | Recent activity events |
| Repo filter | Sidebar selector scopes metrics |

## Repos & stack

**Routes:** `/repos`, `/repos/[id]`  
**API:** `GET /api/repos/[id]`, stack scan via GitHub

| Feature | Description |
|---------|-------------|
| Repo list | Enabled team repos |
| Stack scan | Fetches `package.json`, classifies dependencies |
| Health % | Outdated/critical dependency rollup |
| Detail table | Per-dependency version and status |

## Work (Audit)

**Route:** `/work?tab=projects|tickets`

| Feature | Description |
|---------|-------------|
| Project board | Delivery objects, progress |
| Ticket board | Kanban-style statuses |
| Gantt | Feature timeline on project detail (`feature-gantt`) |
| Hermes ticket tools | Create/update/close via chat |

## Hermes (Analyze)

**Route:** `/hermes`  
**API:** `/api/hermes/chat`, `/api/hermes/webhook`

| Feature | Description |
|---------|-------------|
| Groq chat | LLM with harness tools |
| Demo mode | Offline answers without API key |
| Repo scope | `?repo=` + POST `repo` field |
| `@cursor` | Delegate to Cursor (admin/lead + agents perm) |
| Job tracking | Live status cards + 30s polling |
| Webhook | External POST channel |
| Suggestion chips | Quick prompts in empty state |

See [HERMES.md](./HERMES.md).

## Agents (Act)

**Route:** `/agents`  
**API:** `GET/POST /api/agents`, `PATCH /api/agents/[id]`

| Feature | Description |
|---------|-------------|
| Delegate form | Type, repo, title, prompt |
| Job table | Status, actor, PR link |
| Always-new-PR | Prompt wrapper enforces branch + PR policy |
| Merge conflict job type | Dedicated flow |
| Audit trail | `delegation_audit` rows |
| Permission gate | Admin/lead + repo `agents` |

## Team & access

**Route:** `/team`

| Feature | Description |
|---------|-------------|
| Member list | Roles and budgets |
| Invites | Resend email + join links |
| Access matrix | Member × repo × actions grid |
| Repo sync | GitHub org import (integrations) |

## Integrations (Connect)

**Route:** `/integrations`

| Provider | Sync behavior |
|----------|---------------|
| OpenRouter | Usage USD |
| Trigger.dev | Run history, estimated spend |
| Google | Gmail + Calendar OAuth |
| GCP | Cloud Run health, spend |
| GitHub | Org repos → projects |
| Resend | Invite emails |

## Auth

| Mode | Behavior |
|------|----------|
| Supabase | Google OAuth + magic link |
| Demo | `HARNESS_DEMO_MODE=true`, admin session |
| Middleware | Protects pages/APIs except login, join, webhook |

## Ops loop UI

| Step | Route | Label |
|------|-------|-------|
| 01 Observe | `/` | Command Center |
| 02 Analyze | `/hermes` | Hermes |
| 03 Act | `/agents` | Agents |
| 04 Audit | `/work` | Work |

Context strip preserves `?repo=` across steps.

## Hidden / retained (not in V1 nav)

- CRM (`/crm`)
- Guidelines (`/guidelines`)
- Legacy stack dashboard routes

## GitHub integration features

| Feature | Requires |
|---------|----------|
| List org repos | `GITHUB_TOKEN`, `GITHUB_ORG` |
| Stack scan | Token read access to repo |
| Link repo to project | Matching `repoUrl` |
| Cursor agent on repo | Cursor GitHub App + harness repo URL |

See [GITHUB_PERMISSIONS.md](./GITHUB_PERMISSIONS.md).
