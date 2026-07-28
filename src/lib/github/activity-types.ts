export type GitHubActivityKind =
  | "commit"
  | "pr_opened"
  | "pr_closed"
  | "pr_merged"
  | "issue_opened"
  | "issue_closed"
  | "issue_comment"
  | "workflow_success"
  | "workflow_failure"
  | "workflow_cancelled";

export type GitHubActivityTab =
  | "all"
  | "prs"
  | "issues"
  | "comments"
  | "checks"
  | "updates";

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
  owner?: string;
  repo?: string;
  prNumber?: number;
  issueNumber?: number;
  commentPreview?: string;
}

export interface GitHubActivityFeed {
  events: GitHubActivityEvent[];
  source: "github" | "demo";
  fetchedAt: string;
  repoFullName: string;
  defaultBranch: string;
}
