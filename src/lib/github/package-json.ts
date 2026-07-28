import { Octokit } from "@octokit/rest";

export async function fetchPackageJsonFromRepo(
  repoUrl: string,
  defaultBranch = "main",
): Promise<Record<string, unknown> | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/i);
  if (!match) return null;

  const [, owner, repo] = match;
  const octokit = new Octokit({ auth: token });

  try {
    const res = await octokit.repos.getContent({
      owner,
      repo,
      path: "package.json",
      ref: defaultBranch,
    });

    if (Array.isArray(res.data) || res.data.type !== "file") return null;
    const content = Buffer.from(res.data.content, "base64").toString("utf8");
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}
