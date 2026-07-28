import { NextResponse } from "next/server";
import {
  requireAuth,
  requireRepoAccess,
  AuthError,
} from "@/lib/auth";
import { store } from "@/lib/store/memory-store";
import { fetchGitHubRepoActivity } from "@/lib/github/activity";
import { jsonError } from "@/lib/api/response";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const repo = store.getRepo(id);
    if (!repo) return jsonError("Repo not found", 404);
    requireRepoAccess(session, repo.url, "read");

    const gh = store
      .listGitHubRepositories()
      .find((r) => r.repoId === repo.id || r.url === repo.url);

    const activity = await fetchGitHubRepoActivity({
      repoUrl: repo.url,
      defaultBranch: gh?.defaultBranch ?? "main",
      fullName: gh?.fullName ?? repo.name,
    });

    return NextResponse.json({
      repo: { id: repo.id, name: repo.name, url: repo.url },
      activity,
      githubConnected: Boolean(process.env.GITHUB_TOKEN),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to load GitHub activity");
  }
}
