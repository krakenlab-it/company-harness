-- KrakenLab Harness V1 — permissions, repo access, delegation audit, Gantt fields

-- Per-member repo access (admin-granted)
CREATE TABLE repo_access (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  member_id TEXT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  repo_id TEXT NOT NULL REFERENCES team_repos(id) ON DELETE CASCADE,
  actions JSONB NOT NULL DEFAULT '["read"]',
  granted_by TEXT REFERENCES team_members(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, repo_id)
);

CREATE INDEX idx_repo_access_member_id ON repo_access(member_id);
CREATE INDEX idx_repo_access_repo_id ON repo_access(repo_id);

-- Cursor delegation audit trail
CREATE TABLE delegation_audit (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  job_id TEXT NOT NULL REFERENCES cursor_agent_jobs(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  repo_url TEXT NOT NULL,
  type TEXT NOT NULL,
  prompt_hash TEXT,
  status TEXT NOT NULL,
  pr_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delegation_audit_actor_id ON delegation_audit(actor_id);
CREATE INDEX idx_delegation_audit_job_id ON delegation_audit(job_id);

-- Stack deps scoped to repo
ALTER TABLE stack_dependencies
  ADD COLUMN IF NOT EXISTS repo_id TEXT REFERENCES team_repos(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_stack_dependencies_repo_id ON stack_dependencies(repo_id);

-- Gantt date fields on tickets
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS due_date DATE;

-- Actor on agent jobs
ALTER TABLE cursor_agent_jobs
  ADD COLUMN IF NOT EXISTS actor_id TEXT REFERENCES team_members(id) ON DELETE SET NULL;

-- Extend job type for merge conflicts
ALTER TABLE cursor_agent_jobs DROP CONSTRAINT IF EXISTS cursor_agent_jobs_type_check;
ALTER TABLE cursor_agent_jobs ADD CONSTRAINT cursor_agent_jobs_type_check
  CHECK (type IN ('issue', 'pr', 'feature', 'bugfix', 'refactor', 'merge_conflict'));

-- RLS
ALTER TABLE repo_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegation_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "repo_access_select" ON repo_access FOR SELECT TO authenticated USING (true);
CREATE POLICY "repo_access_write" ON repo_access FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delegation_audit_select" ON delegation_audit FOR SELECT TO authenticated USING (true);
CREATE POLICY "delegation_audit_insert" ON delegation_audit FOR INSERT TO authenticated WITH CHECK (true);
