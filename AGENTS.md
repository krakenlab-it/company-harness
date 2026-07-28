<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Dev server

```bash
pnpm dev
```

Runs Next.js on port 3000. Requires `.env.local` (copy from `.env.example`); demo mode works with `HARNESS_DEMO_MODE=true` without Supabase.

### UI direction

The harness uses an **OpenAI editorial** light theme (white canvas, black text, pill buttons) combined with a **Palantir-style ops loop** bar: **Observe → Analyze → Act → Audit**. Key files:

- Design tokens: `src/app/globals.css`
- Ops loop + context strip: `src/components/layout/ops-loop-bar.tsx`, `context-strip.tsx`
- Wired in: `src/app/(harness)/layout.tsx`

When changing styling, preserve both the light aesthetic and the loop navigation / repo-scoped `?repo=` handoffs.

### Hermes / Groq API key

Hermes uses **`GROQ_API_KEY`** (server-only, not `NEXT_PUBLIC_`).

**Common trap:** `.env.local` with an empty line `GROQ_API_KEY=` **overrides** Cursor Environment Secrets and forces Demo mode. Either **delete that line** or paste your real key there.

**Desktop (most reliable):** in repo root `.env.local`:

```bash
GROQ_API_KEY=gsk_your_key_from_console.groq.com
```

Then restart `pnpm dev`. Confirm: `GET /api/hermes/status` → `"groqKeyPresent": true`.

**Cursor Cloud:** add `GROQ_API_KEY` to the Cloud **Environment** secrets and start a **new agent run** (this pod may not receive secrets if `environment` is unset). Remove empty `GROQ_API_KEY=` from `.env.local` first.

Optional: `GROQ_MODEL` (default `openai/gpt-oss-120b`). No database migrations for Groq.

Optional Hermes tuning: `HERMES_MAX_TOOL_STEPS` (default 12), `HERMES_RATE_LIMIT_RPM` (default 20).

### GitHub repo observability

Repo detail pages (`/repos/[id]`) load **`GET /api/repos/[id]/github`** — commits, PR open/close/merge, and Actions pass/fail. Requires `GITHUB_TOKEN`; without it the UI shows a **demo timeline** (badge: “Demo timeline”). Classic PAT: add `workflow` scope (or fine-grained **Actions: Read** + **Pull requests: Read**).

### Tests & lint

```bash
pnpm test
pnpm build
```
