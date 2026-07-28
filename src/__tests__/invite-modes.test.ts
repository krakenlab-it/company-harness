import { beforeEach, describe, expect, it } from "vitest";
import { store } from "@/lib/store/memory-store";
import {
  acceptTeamInvite,
  createTeamInviteAsync,
  getInvitePublicView,
} from "@/lib/team/invites";
import {
  INVITE_MODE_PRESETS,
  resolveInviteConfig,
  resolveMemberViewSettings,
} from "@/lib/team/invite-modes";

describe("invite modes", () => {
  beforeEach(() => {
    store.reset();
  });

  it("resolves preset config for each mode", () => {
    const admin = resolveInviteConfig({ mode: "admin" });
    expect(admin.role).toBe("admin");
    expect(admin.viewSettings.team).toBe(true);
    expect(admin.repoActions).toContain("secrets");

    const marketing = resolveInviteConfig({ mode: "marketing" });
    expect(marketing.role).toBe("marketing");
    expect(marketing.viewSettings.marketing).toBe(true);
    expect(marketing.viewSettings.repos).toBe(false);
    expect(marketing.repoActions).toEqual(["read"]);
  });

  it("custom mode merges role, nav toggles, and repo actions", () => {
    const custom = resolveInviteConfig({
      mode: "custom",
      role: "viewer",
      viewSettings: { hermes: false, work: true },
      repoActions: ["read", "write"],
    });
    expect(custom.role).toBe("viewer");
    expect(custom.viewSettings.hermes).toBe(false);
    expect(custom.viewSettings.work).toBe(true);
    expect(custom.repoActions).toEqual(["read", "write"]);
  });

  it("creates invite with mode metadata", async () => {
    const project = store.listProjects()[0];
    const { invite } = await createTeamInviteAsync({
      email: "marketer@example.com",
      mode: "marketing",
      projectIds: [project.id],
      sendEmail: false,
    });

    expect(invite.inviteMode).toBe("marketing");
    expect(invite.role).toBe("marketing");
    expect(invite.repoActions).toEqual(["read"]);

    const view = getInvitePublicView(invite.token);
    expect(view?.modeLabel).toBe("Marketing");
    expect(view?.navPreview).toContain("Marketing Studio");
  });

  it("accept applies assignments and repo access from preset", async () => {
    const project = store.listProjects().find((p) => p.repoId);
    expect(project?.repoId).toBeTruthy();

    const { invite } = await createTeamInviteAsync({
      email: "devmode@example.com",
      mode: "dev",
      projectIds: [project!.id],
      sendEmail: false,
    });

    const { member } = acceptTeamInvite({
      token: invite.token,
      name: "Dev Mode User",
    });

    const assignments = store.listProjectAssignments({ email: invite.email });
    expect(assignments.every((a) => a.memberId === member.id)).toBe(true);

    const access = store.getRepoAccess(member.id, project!.repoId!);
    expect(access?.actions).toEqual(INVITE_MODE_PRESETS.dev.defaultRepoActions);

    const settings = resolveMemberViewSettings(member);
    expect(settings.repos).toBe(true);
    expect(settings.integrations).toBe(false);
  });
});
