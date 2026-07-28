export interface ParsedGitHubRepo {
  owner: string;
  repo: string;
}

/** Parse `https://github.com/owner/repo` or SSH-style URLs. */
export function parseGitHubRepoUrl(repoUrl: string): ParsedGitHubRepo | null {
  const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}
