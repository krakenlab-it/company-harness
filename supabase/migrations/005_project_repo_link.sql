-- Project ↔ repo canonical link (mirrors memory store)

ALTER TABLE projects ADD COLUMN IF NOT EXISTS repo_id TEXT REFERENCES team_repos(id);

CREATE INDEX IF NOT EXISTS projects_repo_id_idx ON projects(repo_id);
