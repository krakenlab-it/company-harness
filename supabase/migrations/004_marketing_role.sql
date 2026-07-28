-- Add marketing role and marketing_tasks table (V1 memory store mirrors this shape)

ALTER TABLE team_members
  DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE team_members
  ADD CONSTRAINT team_members_role_check
  CHECK (role IN ('admin', 'lead', 'dev', 'marketing', 'viewer'));

ALTER TABLE team_invites
  DROP CONSTRAINT IF EXISTS team_invites_role_check;

ALTER TABLE team_invites
  ADD CONSTRAINT team_invites_role_check
  CHECK (role IN ('admin', 'lead', 'dev', 'marketing', 'viewer'));

CREATE TABLE IF NOT EXISTS marketing_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  brief TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN (
      'landing_page',
      'ui_redesign',
      'brand_copy',
      'social_campaign',
      'email_campaign',
      'other'
    )
  ),
  status TEXT NOT NULL CHECK (
    status IN ('requested', 'in_progress', 'review', 'done', 'cancelled')
  ),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  requester_id TEXT NOT NULL REFERENCES team_members(id),
  assignee_id TEXT REFERENCES team_members(id),
  project_id TEXT REFERENCES projects(id),
  target_url TEXT,
  due_date TIMESTAMPTZ,
  labels TEXT[] DEFAULT '{}',
  source TEXT NOT NULL CHECK (source IN ('marketing_ui', 'hermes', 'api')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_tasks_status_idx ON marketing_tasks(status);
CREATE INDEX IF NOT EXISTS marketing_tasks_assignee_idx ON marketing_tasks(assignee_id);
