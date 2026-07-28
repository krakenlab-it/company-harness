import type { Project, TeamRepo } from "@/lib/types";
import { store } from "@/lib/store/memory-store";

export function normalizeRepoUrl(url: string): string {
  return url.replace(/\.git$/, "").replace(/\/$/, "").toLowerCase();
}

export function findTeamRepoForProject(project: Project): TeamRepo | undefined {
  if (project.repoId) {
    return store.listRepos().find((r) => r.id === project.repoId);
  }
  if (project.repoUrl) {
    return store.findRepoByUrl(project.repoUrl);
  }
  return undefined;
}

export function findProjectForRepo(repo: TeamRepo): Project | undefined {
  const byId = store
    .listProjects()
    .find((p) => p.repoId === repo.id);
  if (byId) return byId;

  const key = normalizeRepoUrl(repo.url);
  return store.listProjects().find((p) => {
    if (!p.repoUrl) return false;
    return normalizeRepoUrl(p.repoUrl) === key;
  });
}

export interface LinkProjectRepoInput {
  repoId?: string;
  repoUrl?: string;
}

/** Resolve repo and return canonical repoId + repoUrl for a new/updated project. */
export function resolveProjectRepoLink(
  input: LinkProjectRepoInput,
): { repoId: string; repoUrl: string } | { error: string } {
  if (input.repoId?.trim()) {
    const repoId = input.repoId.trim();
    const repo = store.listRepos().find((r) => r.id === repoId);
    if (!repo) return { error: "Repository not found" };
    return { repoId: repo.id, repoUrl: repo.url };
  }

  if (input.repoUrl?.trim()) {
    const existing = store.findRepoByUrl(input.repoUrl.trim());
    if (existing) {
      return { repoId: existing.id, repoUrl: existing.url };
    }
    return { error: "Repository must exist in Team repos — add it under Team & Access first" };
  }

  return { error: "repoId or repoUrl is required — every project must link to a GitHub repository" };
}

export function enrichProjectWithRepo(project: Project) {
  const repo = findTeamRepoForProject(project);
  return {
    ...project,
    repo: repo
      ? { id: repo.id, name: repo.name, url: repo.url }
      : null,
  };
}
