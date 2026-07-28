import { beforeEach, describe, expect, it, vi } from "vitest";
import { store } from "@/lib/store/memory-store";
import { fetchOpenRouterUsage } from "@/lib/integrations/openrouter";
import { syncProvider } from "@/lib/integrations/sync";
import {
  acceptTeamInvite,
  createTeamInviteAsync,
  getInvitePublicView,
} from "@/lib/team/invites";
import { GET as getIntegrations } from "@/app/api/integrations/route";
import { POST as postInvite } from "@/app/api/team/invites/route";
import { GET as getInviteByToken } from "@/app/api/team/invites/[token]/route";
import { POST as acceptInviteApi } from "@/app/api/team/invites/[token]/accept/route";
import { NextRequest } from "next/server";

describe("integrations", () => {
  beforeEach(() => {
    store.reset();
    vi.unstubAllGlobals();
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.TRIGGER_SECRET_KEY;
    delete process.env.GITHUB_TOKEN;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  it("lists integration connections from env", async () => {
    const res = await getIntegrations();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.connections).toHaveLength(6);
    expect(body.connections.map((c: { provider: string }) => c.provider)).toContain(
      "openrouter",
    );
  });

  it("syncs OpenRouter when API key is set", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { usage: 12.5, limit: 100 },
        }),
      }),
    );

    const result = await syncProvider("openrouter");
    expect(result.ok).toBe(true);
    expect(result.details?.usageUsd).toBe(12.5);
    expect(store.listOpenRouterUsage().length).toBe(1);
  });

  it("fetchOpenRouterUsage throws without key", async () => {
    await expect(fetchOpenRouterUsage()).rejects.toThrow("OPENROUTER_API_KEY");
  });
});

describe("team invites", () => {
  beforeEach(() => {
    store.reset();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  it("creates invite with project assignment", async () => {
    const project = store.listProjects()[0];
    const { invite, acceptUrl } = await createTeamInviteAsync({
      email: "newdev@example.com",
      name: "New Dev",
      role: "dev",
      projectIds: [project.id],
      sendEmail: false,
    });

    expect(invite.status).toBe("pending");
    expect(acceptUrl).toContain("/join?token=");
    expect(store.listProjectAssignments({ email: invite.email })).toHaveLength(1);
  });

  it("accepts invite and creates member", () => {
    const created = store.createTeamInvite({
      email: "joiner@example.com",
      role: "viewer",
      projectIds: [],
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    const { member } = acceptTeamInvite({ token: created.token, name: "Joiner" });
    expect(member.email).toBe("joiner@example.com");
    expect(store.getMemberByEmail("joiner@example.com")?.name).toBe("Joiner");
  });

  it("API: POST invite and GET public view", async () => {
    const project = store.listProjects()[0];
    const postRes = await postInvite(
      new NextRequest("http://localhost:3000/api/team/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "api-invite@example.com",
          role: "dev",
          projectIds: [project.id],
          sendEmail: false,
        }),
      }),
    );
    const postBody = await postRes.json();
    expect(postRes.status).toBe(200);
    expect(postBody.acceptUrl).toContain("token=");

    const getRes = await getInviteByToken(
      new NextRequest("http://localhost:3000"),
      { params: Promise.resolve({ token: postBody.invite.token }) },
    );
    const getBody = await getRes.json();
    expect(getBody.invite.email).toBe("api-invite@example.com");
    expect(getInvitePublicView(postBody.invite.token)?.projects.length).toBe(1);
  });

  it("API: accept invite", async () => {
    const created = store.createTeamInvite({
      email: "accept-api@example.com",
      role: "dev",
      projectIds: [],
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    const res = await acceptInviteApi(
      new NextRequest("http://localhost:3000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Accept API" }),
      }),
      { params: Promise.resolve({ token: created.token }) },
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.member.email).toBe("accept-api@example.com");
  });
});
