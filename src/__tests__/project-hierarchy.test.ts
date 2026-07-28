import { beforeEach, describe, expect, it } from "vitest";
import { store } from "@/lib/store/memory-store";
import {
  enrichProjectWithRepo,
  findProjectForRepo,
  resolveProjectRepoLink,
} from "@/lib/projects/link-repo";
import {
  enrichSprintsForProject,
  validateTicketPlacement,
} from "@/lib/projects/sprint-sync";

describe("project hierarchy", () => {
  beforeEach(() => {
    store.reset();
  });

  it("links projects to team repos by repoId", () => {
    const project = store.getProject("proj_harness")!;
    const enriched = enrichProjectWithRepo(project);
    expect(enriched.repo?.id).toBe("repo_harness");
    expect(enriched.repo?.name).toContain("harness");
  });

  it("resolves project from repo", () => {
    const repo = store.listRepos().find((r) => r.id === "repo_pulse")!;
    const project = findProjectForRepo(repo);
    expect(project?.id).toBe("proj_pulse");
  });

  it("requires repo when creating a project link", () => {
    const result = resolveProjectRepoLink({});
    expect("error" in result).toBe(true);
  });

  it("derives sprint tickets from ticket.sprintId", () => {
    const sprints = enrichSprintsForProject("proj_harness");
    const active = sprints.find((s) => s.id === "sprint_harness_3");
    expect(active?.ticketCount).toBeGreaterThan(0);
    expect(active?.tickets.every((t) => t.sprintId === active?.id)).toBe(true);
  });

  it("rejects tickets placed in another project's sprint", () => {
    const err = validateTicketPlacement({
      projectId: "proj_pulse",
      sprintId: "sprint_harness_3",
    });
    expect(err).toMatch(/different project/i);
  });

  it("syncs sprint ticketIds when ticket sprint changes", () => {
    const ticket = store.getTicket("ticket_inkwell_schema")!;
    store.updateTicket(ticket.id, { sprintId: "sprint_harness_3" });
    const sprint = store.getSprint("sprint_harness_3")!;
    expect(sprint.ticketIds).toContain(ticket.id);
  });
});
