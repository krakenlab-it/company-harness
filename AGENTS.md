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

Hermes uses the environment variable **`GROQ_API_KEY`** (not a client-side or public env var).

- **Cursor Environment Secrets:** add `GROQ_API_KEY`, then restart `pnpm dev`.
- **Local:** `.env.local` with the same name also works.
- UI shows **Demo mode** until the key is present and the server has been restarted.
- Optional: `GROQ_MODEL` (default `openai/gpt-oss-120b`).

### Tests & lint

```bash
pnpm test
pnpm build
```
