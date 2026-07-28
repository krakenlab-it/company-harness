# GitHub & Cursor permissions

This guide lists the permissions needed for repo sync, stack scanning, Cursor Cloud Agents, and team access.

## GitHub personal access token (`GITHUB_TOKEN`)

Used by: **Integrations → GitHub sync**, **stack scan** (`package.json` fetch), repo linking.

### Recommended scopes (classic PAT)

| Scope | Why |
|-------|-----|
| `repo` | Read private repo contents (stack scan, metadata) |
| `read:org` | List org repositories when `GITHUB_ORG` is set |
| `read:user` | Associate repos with authenticated user |

For **public repos only**, `public_repo` may suffice.

### Fine-grained PAT (alternative)

- Repository access: select org/repos used in harness
- Permissions:
  - **Contents:** Read
  - **Metadata:** Read
  - **Pull requests:** Read (optional, for PR-aware workflows)

### Org settings

- Org owner may need to **approve** third-party / PAT access
- Ensure token user has **read** access to each harness repo

### Env vars

```bash
GITHUB_TOKEN=ghp_...
GITHUB_ORG=krakenlab   # optional — sync org repos
```

## Cursor Cloud Agents (`CURSOR_API_KEY`)

Used by: **Hermes `@cursor`**, **Agents page**, job status sync.

### Getting a key

1. [Cursor Dashboard → API Keys](https://cursor.com/dashboard/api)
2. Create user or service account key
3. Add to `.env.local`:

```bash
CURSOR_API_KEY=...
```

### API authentication

Cursor v0 uses **HTTP Basic Auth**: API key as username, empty password.

Reference: [Cloud Agents API v0](https://cursor.com/docs/cloud-agent/api/v0)

### GitHub access for Cursor

Cursor agents need access to repositories you delegate:

1. Install **Cursor GitHub App** on org/repos (Cursor settings)
2. Or ensure the API key’s user can launch agents on target repos
3. Repos must match harness URLs (e.g. `https://github.com/krakenlab/harness`)

Use `GET /v0/repositories` (rate limited: ~1/min) to verify visibility.

### Launch payload (harness default)

- `prompt.text` — your `@cursor` instructions (with always-new-PR prefix)
- `source.repository` — GitHub URL from harness repo record
- `source.ref` — `main` (default)
- `target.autoCreatePr` — `true`

## Harness repo permissions (internal)

Separate from GitHub — controls **who can delegate** in the app.

| Action | Meaning |
|--------|---------|
| `read` | See repo in Command Center, Hermes context |
| `write` | Ticket/project edits scoped to repo |
| `agents` | **Required for `@cursor` and Agents UI** |
| `deploy` | Future deploy hooks |
| `secrets` | Future secrets management |

Configure in **Team & Access** → repo matrix (`PATCH /api/access/repos`).

| Role | Default |
|------|---------|
| admin | All actions on all repos |
| lead | Delegates if granted `agents` on repo |
| dev / viewer | No delegation unless explicitly granted |

## Groq (`GROQ_API_KEY`)

- Create at [console.groq.com](https://console.groq.com)
- No GitHub scopes — inference only
- See [HERMES.md](./HERMES.md)

## Supabase

| Key | Use |
|-----|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Client auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side (if used) |

Run migrations `001`–`003` for schema.

## Checklist before go-live

- [ ] `GROQ_API_KEY` — Hermes live
- [ ] `CURSOR_API_KEY` — agent delegation live
- [ ] Cursor GitHub App on all harness repos
- [ ] `GITHUB_TOKEN` with read access to those repos
- [ ] Supabase auth + migrations applied
- [ ] Team members have correct `repo_access` (`agents` for delegators)
- [ ] `HERMES_WEBHOOK_SECRET` if exposing webhook publicly
