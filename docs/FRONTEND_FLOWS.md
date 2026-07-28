# Frontend flows

How users move through the harness UI.

## Shell layout

Every harness page (`src/app/(harness)/layout.tsx`):

1. **Sidebar** — nav, repo filter, sign in
2. **Ops loop bar** — Observe / Analyze / Act / Audit
3. **Context strip** — scope chip, Run intel, Delegate
4. **Page content** — topbar + main panel

Design tokens: `src/app/globals.css` (OpenAI light theme + ops loop classes).

## Ops loop journey

```mermaid
flowchart LR
  A[01 Observe<br/>Command Center] --> B[02 Analyze<br/>Hermes]
  B --> C[03 Act<br/>Agents]
  C --> D[04 Audit<br/>Work]
  A -.->|Intel link| B
  A -.->|Act link| C
  B -.->|@cursor| C
```

**Repo scope:** append `?repo=krakenlab/harness` (or full GitHub URL). Loop links and context strip preserve the query param.

## Flow: Ask Hermes about spend

1. Open **Hermes** (Analyze step)
2. Type: "What are we spending this month?"
3. Client `POST /api/hermes/chat` with message
4. Groq + tools → reply rendered in chat
5. Badges update (entities, tickets, missions)

## Flow: Delegate with `@cursor`

1. **Admin/lead** sets repo filter or `?repo=`
2. Open Hermes composer
3. Send: `@cursor Add export button to settings page`
4. API intercepts — no Groq call for this message
5. Cursor agent launched; assistant message + **job card**
6. UI polls GET chat every 30s; card shows running → completed + PR link

Alternative: **Context strip → Delegate** or Command Center **Act** link → Agents form.

## Flow: Command Center triage

1. Land on `/` (Observe)
2. Scan metric tiles and entity table
3. Click **Intel** on a row → Hermes with repo scope
4. Click **Act** (if permitted) → Agents with repo pre-filled
5. Review mission queue + audit trail panels

## Flow: Manage repo permissions

1. **Team & Access** as admin
2. Access matrix: toggle actions per member/repo
3. Grant **agents** to leads who should use `@cursor`
4. Changes apply immediately to API checks

## Flow: Team invite

1. Team → Invite teammate
2. Email via Resend (or copy link in dev)
3. Invitee `/join?token=…` → auth → accept
4. Member created with project assignments

## Flow: Integration sync

1. Add keys to `.env.local`
2. Integrations → **Sync now** per provider
3. Command Center connector strip reflects status
4. Costs update in Stack & provider tables

## Key components

| Component | Path |
|-----------|------|
| Ops loop | `src/components/layout/ops-loop-bar.tsx` |
| Context strip | `src/components/layout/context-strip.tsx` |
| Command Center | `src/components/command/command-center-view.tsx` |
| Hermes chat | `src/components/hermes/chat.tsx` |
| Cursor job card | `src/components/hermes/cursor-job-card.tsx` |
| Agent console | `src/components/agents/agent-console.tsx` |
| Access matrix | `src/components/team/access-matrix.tsx` |

## Mobile

- Sidebar collapses to horizontal nav header
- Ops loop scrolls horizontally
- Tables horizontally scroll inside panels
