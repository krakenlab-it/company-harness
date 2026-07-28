export type GitHubActivityKind =
  | "commit"
  | "pr_opened"
  | "pr_closed"
  | "pr_merged"
  | "workflow_success"
  | "workflow_failure"
  | "workflow_cancelled";

export interface GitHubActivityEvent {
  id: string;
  kind: GitHubActivityKind;
  title: string;
  subtitle?: string;
  url?: string;
  actor?: string;
  branch?: string;
  sha?: string;
  occurredAt: string;
}

export interface GitHubActivityFeed {
  events: GitHubActivityEvent[];
  source: "github" | "demo";
  fetchedAt: string;
  repoFullName: string;
  defaultBranch: string;
}
