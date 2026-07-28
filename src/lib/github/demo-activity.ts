import type { GitHubActivityEvent, GitHubActivityFeed } from "@/lib/github/activity-types";

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

/** Synthetic timeline when GITHUB_TOKEN is missing — keeps repo pages usable in demo. */
export function buildDemoGitHubActivity(
  fullName: string,
  defaultBranch = "main",
): GitHubActivityFeed {
  const [owner, repo] = fullName.includes("/")
    ? fullName.split("/")
    : ["krakenlab", fullName];

  const enrich = (
    event: Omit<GitHubActivityEvent, "owner" | "repo">,
  ): GitHubActivityEvent => ({ ...event, owner, repo });

  const events: GitHubActivityEvent[] = [
    enrich({
      id: "demo-wf-1",
      kind: "workflow_success",
      title: "CI / test",
      subtitle: "All checks passed on main",
      actor: "github-actions",
      branch: defaultBranch,
      occurredAt: hoursAgo(2),
      url: `https://github.com/${owner}/${repo}/actions`,
    }),
    enrich({
      id: "demo-issue-open",
      kind: "issue_opened",
      title: "Login page shows blank screen on Safari",
      subtitle: "Open · reported by ops",
      actor: "jamie",
      issueNumber: 87,
      occurredAt: hoursAgo(3),
      url: `https://github.com/${owner}/${repo}/issues/87`,
    }),
    enrich({
      id: "demo-comment-1",
      kind: "issue_comment",
      title: "Comment on #87: Login page shows blank screen on Safari",
      subtitle: "Login page shows blank screen on Safari",
      actor: "alex",
      issueNumber: 87,
      commentPreview:
        "Reproduced on Safari 17 — looks like a CSP issue on the auth bundle.",
      occurredAt: hoursAgo(3.5),
      url: `https://github.com/${owner}/${repo}/issues/87#issuecomment-demo`,
    }),
    enrich({
      id: "demo-pr-merged",
      kind: "pr_merged",
      title: "feat: improve GitHub observability on repo page",
      subtitle: "Merged into main",
      actor: "alex",
      branch: defaultBranch,
      prNumber: 42,
      occurredAt: hoursAgo(5),
      url: `https://github.com/${owner}/${repo}/pull/42`,
    }),
    enrich({
      id: "demo-commit-1",
      kind: "commit",
      title: "Add git activity graph component",
      subtitle: "cursor/hermes-cursor-groq-docs-f5b5",
      actor: "alex",
      sha: "a1b2c3d",
      branch: "cursor/hermes-cursor-groq-docs-f5b5",
      occurredAt: hoursAgo(6),
      url: `https://github.com/${owner}/${repo}/commit/a1b2c3d`,
    }),
    enrich({
      id: "demo-pr-open",
      kind: "pr_opened",
      title: "Hermes multi-step tools + rate limiting",
      subtitle: "Opened · feature branch → main",
      actor: "alex",
      prNumber: 41,
      branch: "cursor/hermes-provider-selector-f5b5",
      occurredAt: hoursAgo(8),
      url: `https://github.com/${owner}/${repo}/pull/41`,
    }),
    enrich({
      id: "demo-wf-fail",
      kind: "workflow_failure",
      title: "CI / lint",
      subtitle: "ESLint failed on feature branch",
      actor: "github-actions",
      branch: "cursor/palantir-ops-loop-f5b5",
      occurredAt: hoursAgo(12),
      url: `https://github.com/${owner}/${repo}/actions`,
    }),
    enrich({
      id: "demo-issue-closed",
      kind: "issue_closed",
      title: "Update onboarding copy for non-technical users",
      subtitle: "Closed",
      actor: "sam",
      issueNumber: 72,
      occurredAt: hoursAgo(18),
      url: `https://github.com/${owner}/${repo}/issues/72`,
    }),
    enrich({
      id: "demo-pr-closed",
      kind: "pr_closed",
      title: "chore: bump deps (superseded)",
      subtitle: "Closed without merge",
      actor: "sam",
      prNumber: 38,
      occurredAt: hoursAgo(24),
      url: `https://github.com/${owner}/${repo}/pull/38`,
    }),
    enrich({
      id: "demo-commit-2",
      kind: "commit",
      title: "fix: empty Hermes reply after tool calls",
      actor: "alex",
      sha: "f4e5d6c",
      branch: defaultBranch,
      occurredAt: hoursAgo(26),
      url: `https://github.com/${owner}/${repo}/commit/f4e5d6c`,
    }),
  ];

  return {
    events,
    source: "demo",
    fetchedAt: new Date().toISOString(),
    repoFullName: `${owner}/${repo}`,
    defaultBranch,
  };
}
