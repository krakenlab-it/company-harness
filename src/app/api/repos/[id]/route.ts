import { NextResponse } from "next/server";
import {
  requireAuth,
  requireRepoAccess,
  canManageAccess,
  AuthError,
} from "@/lib/auth";
import { store } from "@/lib/store/memory-store";
import { analyzePackageJson } from "@/lib/stack/analyzer";
import { fetchPackageJsonFromRepo } from "@/lib/github/package-json";
import { jsonError } from "@/lib/api/response";
import { uid } from "@/lib/utils";

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

    const stack = store.listStack().filter((s) => s.repoId === repo.id);
    const gh = store.listGitHubRepositories().find((r) => r.repoId === repo.id || r.url === repo.url);
    const project = store.listProjects().find(
      (p) => p.repoUrl?.replace(/\/$/, "") === repo.url.replace(/\/$/, ""),
    );

    return NextResponse.json({ repo, stack, github: gh, project });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to load repo");
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const repo = store.getRepo(id);
    if (!repo) return jsonError("Repo not found", 404);
    requireRepoAccess(session, repo.url, "read");
    if (!canManageAccess(session) && session.role !== "lead") {
      return jsonError("Forbidden", 403);
    }

    const gh = store.listGitHubRepositories().find((r) => r.url === repo.url);
    const pkg = await fetchPackageJsonFromRepo(
      repo.url,
      gh?.defaultBranch ?? "main",
    );

    if (!pkg) {
      return jsonError("Could not fetch package.json from GitHub", 502);
    }

    const analyzed = analyzePackageJson(pkg);
    store.replaceStackForRepo(
      repo.id,
      analyzed.map((dep) => ({
        ...dep,
        id: uid("stack"),
        repoId: repo.id,
        projectId: store
          .listProjects()
          .find((p) => p.repoUrl?.includes(repo.name.split("/").pop() ?? ""))?.id,
      })),
    );

    return NextResponse.json({
      repo,
      stack: store.listStack().filter((s) => s.repoId === repo.id),
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Stack scan failed");
  }
}
