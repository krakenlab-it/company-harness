# Hermes

Hermes is the harness **AI assistant** (NVIDIA NIM or Groq via Vercel AI SDK). It reads live harness context, calls tools, manages tickets, and (for admin/lead) launches **Cursor Cloud Agents** via `@cursor`.

## LLM providers

| Provider | Default model | Env key |
|----------|---------------|---------|
| **NVIDIA NIM** | `z-ai/glm-5.2` | `NVIDIA_API_KEY` |
| **Groq** | `openai/gpt-oss-120b` | `GROQ_API_KEY` |

Use the **model selector** in the Hermes header, or pass `provider` + `model` on POST `/api/hermes/chat`.

Other NVIDIA models in the UI: Kimi K2 (`moonshotai/kimi-k2-instruct`, `moonshotai/kimi-k2-thinking`), Nemotron 3 Ultra, GLM 4.7.

```bash
NVIDIA_API_KEY=nvapi_...
NVIDIA_MODEL=z-ai/glm-5.2
GROQ_API_KEY=gsk_...
HERMES_DEFAULT_PROVIDER=nvidia   # or groq
```

Endpoint: `https://integrate.api.nvidia.com/v1` (OpenAI-compatible). **Never commit API keys** — use `.env.local` or Cursor Environment secrets.

## Composer tags (Cursor-style)

| Token | Purpose |
|-------|---------|
| `@cursor` | Delegate to Cursor Cloud Agent |
| `@repo org/name` | Scope to a repository |
| `/ticket tkt_…` | Link a harness ticket |
| `/pr 42` | Reference a pull request |
| `/project proj_…` | Scope to a project |

Tags highlight in the composer and appear as chips on sent messages.

## Groq setup

Hermes reads **`GROQ_API_KEY`** from the process environment (same name everywhere).

### Cursor Desktop / Cloud Agent (recommended)

1. Open your agent **Environment** settings (Environment Secrets / variables).
2. Add: **`GROQ_API_KEY`** = your key from [console.groq.com](https://console.groq.com).
3. **Restart the dev server** (`pnpm dev`) — Next.js only loads env vars at startup.
4. Open Hermes — you should see **Groq · openai/gpt-oss-120b** (not “Demo mode”).

Optional: **`GROQ_MODEL`** to override the default model.

### Local `.env.local` (alternative)

```bash
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b
```

Copy from `.env.example`, restart `pnpm dev`.

> **Note:** Cursor Environment Secrets and `.env.local` both work. You do **not** need both — use whichever matches how you run the app. After changing either one, restart the server.

### How Groq is wired

- Package: `@ai-sdk/groq` + `ai` (`generateText`)
- Code: `src/lib/hermes/agent.ts`
- Model: `getHermesGroqModel()` → `GROQ_MODEL` or **`openai/gpt-oss-120b`** (128k context, native tool use, ~500 t/s on Groq)
- Docs: [Groq quickstart](https://console.groq.com/docs/quickstart), [AI SDK + Groq](https://sdk.vercel.ai/providers/ai-sdk-providers/groq)

Without `GROQ_API_KEY`, Hermes runs in **demo mode** with keyword-based offline answers (projects, costs, tickets).

## Chat API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/hermes/chat` | History, context stats, sync running Cursor jobs |
| POST | `/api/hermes/chat` | Send message; intercepts `@cursor` |

POST body:

```json
{
  "message": "Summarize open tickets",
  "repo": "krakenlab/harness",
  "provider": "nvidia",
  "model": "z-ai/glm-5.2"
}
```

## `@cursor` command

**Who:** Admin or lead with **`agents`** permission on the target repo.

**Syntax:**

```
@cursor <instructions>
@cursor feature: <instructions>
@cursor bugfix: <instructions>
@cursor merge_conflict: <instructions>
```

**Repo scope:**

- Set repo filter in sidebar, or open Hermes with `?repo=krakenlab/harness`
- POST includes `repo` from URL scope
- Without scope, first repo with `agents` permission is used

**What happens:**

1. Message is parsed (`src/lib/hermes/cursor-command.ts`)
2. Permissions checked (`handle-cursor-delegation.ts`)
3. `delegateToCursor()` calls Cursor `POST /v0/agents` with always-new-PR prompt wrapper
4. Assistant reply + **tracked job card** in chat
5. UI polls every **30 seconds** until job completes

**Example:**

```
@cursor Add rate limiting to the login API and open a PR
```

## Hermes tools (Groq tool calling)

| Tool | Action |
|------|--------|
| `list_visible_repos` | Repos user can see |
| `scan_repo_context` | Stack + metadata for a repo |
| `list_projects` / `get_project_status` | Project delivery |
| `list_tickets` / `create_ticket` / `update_ticket` / `close_ticket` / `reopen_ticket` | Ticket lifecycle |
| `list_costs` / `update_cost` | Provider spend |
| `list_crm_contacts` / `create_crm_note` | CRM (hidden from V1 nav) |
| `list_agent_jobs` | Read Cursor job status |
| `get_guidelines` | Company stack guidelines |
| `get_team_budget` | Budget categories |

Hermes does **not** have a `delegate_to_cursor` tool — delegation is only via `@cursor` prefix or Agents UI.

## Webhook channel

External systems can POST to `/api/hermes/webhook`:

```json
{
  "text": "Summarize active projects",
  "secret": "optional-if-HERMES_WEBHOOK_SECRET-set"
}
```

Set `HERMES_WEBHOOK_SECRET` to require `secret` or `Authorization: Bearer`.

## Progress tracking

- Jobs stored in `cursor_agent_jobs` (memory store / Supabase)
- Hermes messages link jobs via `contextType: agent_job`, `contextId: <job_id>`
- `syncRunningAgentJobs()` polls Cursor `GET /v0/agents/:id` on chat GET/POST and Agents GET
- Status mapping: `RUNNING` → running, `FINISHED` → completed, `FAILED` → failed

## Security

- All chat routes require auth (except webhook with secret)
- `@cursor` requires role + repo `agents` permission
- Delegation audit rows in `delegation_audit`
- API keys never exposed to client or LLM context
