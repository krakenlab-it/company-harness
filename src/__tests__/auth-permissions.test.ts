import { beforeEach, describe, expect, it } from "vitest";
import { store } from "@/lib/store/memory-store";
import {
  getSession,
  memberHasRepoAccess,
  getVisibleRepos,
  hasAnyAgentsPermission,
  requireRepoAccess,
  AuthError,
} from "@/lib/auth/permissions";
import { blockHermesDelegation } from "@/lib/auth/api";
import { POST as postAgents } from "@/app/api/agents/route";
import { PATCH as patchAccess } from "@/app/api/access/repos/route";
import { createHermesTools } from "@/lib/hermes/tools";
import { NextRequest } from "next/server";

function jsonRequest(url: string, method: string, body?: unknown, headers?: Record<string, string>) {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("V1 auth and permissions", () => {
  beforeEach(() => {
    store.reset();
    process.env.HARNESS_DEMO_MODE = "true";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.CURSOR_API_KEY;
  });

  it("returns demo admin session when HARNESS_DEMO_MODE is true", async () => {
    const session = await getSession();
    expect(session).not.toBeNull();
    expect(session?.role).toBe("admin");
    expect(session?.memberId).toBe("member_alex");
  });

  it("scopes visible repos by repo_access for non-admin members", () => {
    const samRepos = getVisibleRepos("member_sam");
    expect(samRepos).toHaveLength(1);
    expect(samRepos[0]?.id).toBe("repo_harness");

    const taylorRepos = getVisibleRepos("member_taylor");
    expect(taylorRepos).toHaveLength(1);
    expect(taylorRepos[0]?.id).toBe("repo_harness");
  });

  it("enforces repo action permissions", () => {
    expect(
      memberHasRepoAccess(
        "member_sam",
        "https://github.com/krakenlab/harness",
        "agents",
      ),
    ).toBe(false);
    expect(
      memberHasRepoAccess(
        "member_jordan",
        "https://github.com/krakenlab/harness",
        "agents",
      ),
    ).toBe(true);
  });

  it("requires agents permission for delegation eligibility", () => {
    expect(hasAnyAgentsPermission("member_alex")).toBe(true);
    expect(hasAnyAgentsPermission("member_sam")).toBe(false);
    expect(hasAnyAgentsPermission("member_jordan")).toBe(true);
  });

  it("blocks Hermes from delegating Cursor agents", () => {
    expect(() =>
      blockHermesDelegation(
        new Request("http://localhost/api/agents", {
          headers: { "x-harness-source": "hermes" },
        }),
      ),
    ).toThrow(AuthError);
  });

  it("rejects agent delegation without repo", async () => {
    const res = await postAgents(
      jsonRequest("/api/agents", "POST", {
        type: "feature",
        title: "Test",
        prompt: "Do something",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("allows admin to delegate with repo", async () => {
    const res = await postAgents(
      jsonRequest("/api/agents", "POST", {
        type: "feature",
        title: "Fix auth redirect",
        prompt: "Investigate login redirect",
        repo: "https://github.com/krakenlab/harness",
      }),
    );
    expect(res.status).toBeLessThan(300);
    const body = await res.json();
    expect(body.job?.title).toBe("Fix auth redirect");
  });

  it("updates repo access matrix via PATCH", async () => {
    const res = await patchAccess(
      jsonRequest("/api/access/repos", "PATCH", {
        memberId: "member_sam",
        repoId: "repo_harness",
        actions: ["read", "write", "agents"],
      }),
    );
    expect(res.status).toBe(200);
    expect(
      memberHasRepoAccess(
        "member_sam",
        "https://github.com/krakenlab/harness",
        "agents",
      ),
    ).toBe(true);
  });

  it("Hermes tools include ticket lifecycle without delegate_to_cursor", () => {
    const tools = createHermesTools({ memberId: "member_alex" });
    expect(tools.update_ticket).toBeDefined();
    expect(tools.close_ticket).toBeDefined();
    expect(tools.reopen_ticket).toBeDefined();
    expect(tools.scan_repo_context).toBeDefined();
    expect(tools.list_visible_repos).toBeDefined();
    expect("delegate_to_cursor" in tools).toBe(false);
  });

  it("Hermes close_ticket sets status to done", async () => {
    const ticket = store.listTickets()[0];
    const tools = createHermesTools({ memberId: "member_alex" });
    const result = await tools.close_ticket.execute!(
      { ticketId: ticket.id },
      {} as never,
    );
    expect(result).toMatchObject({ status: "done" });
  });

  it("requireRepoAccess throws when access missing", () => {
    const session = {
      authUserId: null,
      memberId: "member_sam",
      email: "sam@krakenlab.media",
      name: "Sam Patel",
      role: "dev" as const,
      member: store.getMember("member_sam")!,
    };
    expect(() =>
      requireRepoAccess(
        session,
        "https://github.com/krakenlab/pulse-analytics",
        "read",
      ),
    ).toThrow(AuthError);
  });
});
