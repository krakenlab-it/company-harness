import type {
  GitHubActivityEvent,
  GitHubActivityFeed,
  GitHubActivityKind,
} from "@/lib/github/activity-types";
import { buildDemoGitHubActivity } from "@/lib/github/demo-activity";
import { parseGitHubRepoUrl } from "@/lib/github/parse-repo-url";
import { createGitHubClient } from "@/lib/integrations/github";

function prKind(
  merged: boolean,
  state: string,
): GitHubActivityKind {
  if (merged) return "pr_merged";
  if (state === "closed") return "pr_closed";
  return "pr_opened";
}

function workflowKind(
  conclusion: string | null | undefined,
): GitHubActivityKind | null {
  if (conclusion === "success") return "workflow_success";
  if (conclusion === "failure") return "workflow_failure";
  if (conclusion === "cancelled") return "workflow_cancelled";
  return null;
}

export function mergeAndSortActivityEvents(
  events: GitHubActivityEvent[],
  limit = 40,
): GitHubActivityEvent[] {
  return [...events]
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    )
    .slice(0, limit);
}

export async function fetchGitHubRepoActivity(options: {
  repoUrl: string;
  defaultBranch?: string;
  fullName?: string;
}): Promise<GitHubActivityFeed> {
  const parsed = parseGitHubRepoUrl(options.repoUrl);
  const defaultBranch = options.defaultBranch ?? "main";
  const fullName =
    options.fullName ??
    (parsed ? `${parsed.owner}/${parsed.repo}` : options.repoUrl);

  if (!process.env.GITHUB_TOKEN || !parsed) {
    return buildDemoGitHubActivity(fullName, defaultBranch);
  }

  const octokit = createGitHubClient();
  const { owner, repo } = parsed;

  const events: GitHubActivityEvent[] = [];

  try {
    const [commits, pulls, runs] = await Promise.all([
      octokit.repos.listCommits({
        owner,
        repo,
        sha: defaultBranch,
        per_page: 15,
      }),
      octokit.pulls.list({
        owner,
        repo,
        state: "all",
        sort: "updated",
        direction: "desc",
        per_page: 15,
      }),
      octokit.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: 12,
      }),
    ]);

    for (const commit of commits.data) {
      const sha = commit.sha.slice(0, 7);
      events.push({
        id: `commit-${commit.sha}`,
        kind: "commit",
        title: commit.commit.message.split("\n")[0] ?? "Commit",
        subtitle: commit.commit.author?.name ?? undefined,
        actor: commit.author?.login ?? commit.commit.author?.name,
        sha,
        branch: defaultBranch,
        url: commit.html_url,
        occurredAt:
          commit.commit.author?.date ??
          commit.commit.committer?.date ??
          new Date().toISOString(),
      });
    }

    for (const pr of pulls.data) {
      const merged = Boolean(pr.merged_at);
      const occurredAt =
        pr.merged_at ??
        pr.closed_at ??
        pr.updated_at ??
        pr.created_at ??
        new Date().toISOString();

      events.push({
        id: `pr-${pr.number}`,
        kind: prKind(merged, pr.state),
        title: pr.title,
        subtitle: merged
          ? `Merged into ${pr.base.ref}`
          : pr.state === "closed"
            ? "Closed without merge"
            : `Opened · ${pr.head.ref} → ${pr.base.ref}`,
        actor: pr.user?.login,
        branch: pr.head.ref,
        url: pr.html_url,
        occurredAt,
      });
    }

    for (const run of runs.data.workflow_runs ?? []) {
      const kind = workflowKind(run.conclusion);
      if (!kind) continue;

      events.push({
        id: `wf-${run.id}`,
        kind,
        title: run.name ?? run.display_title ?? "Workflow run",
        subtitle:
          run.conclusion === "success"
            ? "All jobs succeeded"
            : run.conclusion === "failure"
              ? "One or more jobs failed"
              : "Run cancelled",
        actor: run.actor?.login ?? "github-actions",
        branch: run.head_branch ?? undefined,
        url: run.html_url,
        occurredAt: run.updated_at ?? run.created_at ?? new Date().toISOString(),
      });
    }
  } catch (error) {
    console.warn("[github-activity] fetch failed, using demo feed", error);
    return buildDemoGitHubActivity(fullName, defaultBranch);
  }

  return {
    events: mergeAndSortActivityEvents(events),
    source: "github",
    fetchedAt: new Date().toISOString(),
    repoFullName: fullName,
    defaultBranch,
  };
}
