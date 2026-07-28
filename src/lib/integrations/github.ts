import { Octokit } from "@octokit/rest";
import type { GitHubRepositorySync } from "@/lib/types";

export function createGitHubClient(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is not configured");
  }
  return new Octokit({ auth: token });
}

export async function fetchGitHubRepositories(): Promise<
  Omit<GitHubRepositorySync, "id" | "syncedAt">[]
> {
  const octokit = createGitHubClient();
  const org = process.env.GITHUB_ORG?.trim();

  const repos = org
    ? (
        await octokit.repos.listForOrg({
          org,
          type: "all",
          sort: "pushed",
          per_page: 50,
        })
      ).data
    : (await octokit.repos.listForAuthenticatedUser({ sort: "pushed", per_page: 50 }))
        .data;

  return repos.map((repo) => ({
    externalId: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url,
    defaultBranch: repo.default_branch ?? "main",
    lastPushAt: repo.pushed_at ?? undefined,
    openIssues: repo.open_issues_count ?? 0,
    projectId: undefined,
  }));
}

export function matchRepoToProject(
  repoUrl: string,
  projectRepoUrl?: string,
): boolean {
  if (!projectRepoUrl) return false;
  const normalize = (url: string) =>
    url.replace(/\.git$/, "").replace(/\/$/, "").toLowerCase();
  return normalize(repoUrl) === normalize(projectRepoUrl);
}
