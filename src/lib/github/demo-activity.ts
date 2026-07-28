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

  const events: GitHubActivityEvent[] = [
    {
      id: "demo-wf-1",
      kind: "workflow_success",
      title: "CI / test",
      subtitle: "All checks passed on main",
      actor: "github-actions",
      branch: defaultBranch,
      occurredAt: hoursAgo(2),
      url: `https://github.com/${owner}/${repo}/actions`,
    },
    {
      id: "demo-pr-merged",
      kind: "pr_merged",
      title: "feat: improve GitHub observability on repo page",
      subtitle: "Merged into main",
      actor: "alex",
      branch: defaultBranch,
      occurredAt: hoursAgo(5),
      url: `https://github.com/${owner}/${repo}/pull/42`,
    },
    {
      id: "demo-commit-1",
      kind: "commit",
      title: "Add git activity graph component",
      subtitle: "cursor/hermes-cursor-groq-docs-f5b5",
      actor: "alex",
      sha: "a1b2c3d",
      branch: "cursor/hermes-cursor-groq-docs-f5b5",
      occurredAt: hoursAgo(6),
      url: `https://github.com/${owner}/${repo}/commit/a1b2c3d`,
    },
    {
      id: "demo-pr-open",
      kind: "pr_opened",
      title: "Hermes multi-step tools + rate limiting",
      subtitle: "Opened by alex",
      actor: "alex",
      occurredAt: hoursAgo(8),
      url: `https://github.com/${owner}/${repo}/pull/41`,
    },
    {
      id: "demo-wf-fail",
      kind: "workflow_failure",
      title: "CI / lint",
      subtitle: "ESLint failed on feature branch",
      actor: "github-actions",
      branch: "cursor/palantir-ops-loop-f5b5",
      occurredAt: hoursAgo(12),
      url: `https://github.com/${owner}/${repo}/actions`,
    },
    {
      id: "demo-pr-closed",
      kind: "pr_closed",
      title: "chore: bump deps (superseded)",
      subtitle: "Closed without merge",
      actor: "sam",
      occurredAt: hoursAgo(24),
      url: `https://github.com/${owner}/${repo}/pull/38`,
    },
    {
      id: "demo-commit-2",
      kind: "commit",
      title: "fix: empty Hermes reply after tool calls",
      actor: "alex",
      sha: "f4e5d6c",
      branch: defaultBranch,
      occurredAt: hoursAgo(26),
      url: `https://github.com/${owner}/${repo}/commit/f4e5d6c`,
    },
  ];

  return {
    events,
    source: "demo",
    fetchedAt: new Date().toISOString(),
    repoFullName: `${owner}/${repo}`,
    defaultBranch,
  };
}
