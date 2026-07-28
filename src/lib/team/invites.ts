import { store } from "@/lib/store/memory-store";
import type { InviteMode, MemberViewSettings, RepoAction, TeamInvite, TeamMemberRole } from "@/lib/types";
import {
  getInvitePublicModeSummary,
  resolveInviteConfig,
} from "@/lib/team/invite-modes";
import {
  sendTeamInviteEmail,
  buildInviteUrl,
  isResendConfigured,
} from "@/lib/integrations/resend-invites";

const INVITE_TTL_DAYS = 7;

function applyProjectRepoAccess(input: {
  memberId: string;
  projectIds: string[];
  repoActions: RepoAction[];
  grantedBy?: string;
}): void {
  const repoIds = new Set<string>();
  for (const projectId of input.projectIds) {
    const project = store.getProject(projectId);
    if (project?.repoId) {
      repoIds.add(project.repoId);
    }
  }

  for (const repoId of repoIds) {
    store.setRepoAccess({
      memberId: input.memberId,
      repoId,
      actions: input.repoActions,
      grantedBy: input.grantedBy,
    });
  }
}

function linkProjectAssignments(email: string, memberId: string): void {
  const assignments = store.listProjectAssignments({ email });
  for (const assignment of assignments) {
    store.updateProjectAssignment(assignment.id, { memberId });
  }
}

export async function createTeamInviteAsync(input: {
  email: string;
  name?: string;
  mode?: InviteMode;
  role?: TeamMemberRole;
  viewSettings?: Partial<MemberViewSettings>;
  repoActions?: RepoAction[];
  projectIds: string[];
  invitedById?: string;
  sendEmail?: boolean;
}): Promise<{
  invite: TeamInvite;
  acceptUrl: string;
  emailSent: boolean;
  emailError?: string;
}> {
  const existing = store.getMemberByEmail(input.email);
  if (existing) {
    throw new Error("A team member with this email already exists");
  }

  const pending = store
    .listTeamInvites("pending")
    .find((i) => i.email.toLowerCase() === input.email.toLowerCase());
  if (pending) {
    throw new Error("A pending invite already exists for this email");
  }

  const mode = input.mode ?? "dev";
  const config = resolveInviteConfig({
    mode,
    role: input.role,
    viewSettings: input.viewSettings,
    repoActions: input.repoActions,
  });

  const expiresAt = new Date(
    Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const invite = store.createTeamInvite({
    email: input.email.toLowerCase(),
    name: input.name,
    role: config.role,
    inviteMode: mode,
    viewSettings: config.viewSettings,
    repoActions: config.repoActions,
    projectIds: input.projectIds,
    invitedById: input.invitedById,
    expiresAt,
  });

  for (const projectId of input.projectIds) {
    store.createProjectAssignment({
      projectId,
      email: invite.email,
      role: config.role,
    });
  }

  const acceptUrl = buildInviteUrl(invite.token);
  let emailSent = false;
  let emailError: string | undefined;

  if (input.sendEmail !== false && isResendConfigured()) {
    try {
      const inviter = input.invitedById
        ? store.getMember(input.invitedById)
        : undefined;
      const projects = input.projectIds
        .map((id) => store.getProject(id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));

      await sendTeamInviteEmail({
        invite,
        projects,
        inviterName: inviter?.name,
      });
      emailSent = true;
    } catch (err) {
      emailError = err instanceof Error ? err.message : "Failed to send email";
    }
  }

  store.addActivity({
    entityType: "team_invite",
    entityId: invite.id,
    action: "created",
    summary: `Invited ${invite.email} as ${mode} (${invite.role})`,
    actorId: input.invitedById,
  });

  return { invite, acceptUrl, emailSent, emailError };
}

export function acceptTeamInvite(input: {
  token: string;
  name?: string;
  authUserId?: string;
}): {
  member: ReturnType<typeof store.createMember>;
  invite: TeamInvite;
} {
  const invite = store.getTeamInviteByToken(input.token);
  if (!invite) {
    throw new Error("Invite not found");
  }
  if (invite.status !== "pending") {
    throw new Error(`Invite is ${invite.status}`);
  }
  if (new Date(invite.expiresAt) < new Date()) {
    store.updateTeamInvite(invite.id, { status: "expired" });
    throw new Error("Invite has expired");
  }

  const config = resolveInviteConfig({
    mode: invite.inviteMode ?? "dev",
    role: invite.role,
    viewSettings: invite.viewSettings,
    repoActions: invite.repoActions,
  });

  const existing = store.getMemberByEmail(invite.email);
  if (existing) {
    store.updateTeamInvite(invite.id, {
      status: "accepted",
      acceptedAt: new Date().toISOString(),
    });
    linkProjectAssignments(invite.email, existing.id);
    applyProjectRepoAccess({
      memberId: existing.id,
      projectIds: invite.projectIds,
      repoActions: config.repoActions,
      grantedBy: invite.invitedById,
    });
    return {
      member: existing,
      invite: store.getTeamInviteByToken(input.token)!,
    };
  }

  const member = store.createMember({
    name: input.name ?? invite.name ?? invite.email.split("@")[0],
    email: invite.email,
    role: config.role,
    inviteMode: invite.inviteMode ?? "dev",
    viewSettings: config.viewSettings,
    authUserId: input.authUserId,
  });

  linkProjectAssignments(invite.email, member.id);
  applyProjectRepoAccess({
    memberId: member.id,
    projectIds: invite.projectIds,
    repoActions: config.repoActions,
    grantedBy: invite.invitedById,
  });

  store.addActivity({
    entityType: "team_member",
    entityId: member.id,
    action: "joined",
    summary: `${member.name} joined the team via ${invite.inviteMode ?? "dev"} invite`,
  });

  const updatedInvite = store.updateTeamInvite(invite.id, {
    status: "accepted",
    acceptedAt: new Date().toISOString(),
  })!;

  return { member, invite: updatedInvite };
}

export function getInvitePublicView(token: string) {
  const invite = store.getTeamInviteByToken(token);
  if (!invite) return null;

  const expired =
    invite.status === "pending" && new Date(invite.expiresAt) < new Date();

  const projects = invite.projectIds
    .map((id) => store.getProject(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const modeSummary = getInvitePublicModeSummary(invite);

  return {
    email: invite.email,
    name: invite.name,
    role: invite.role,
    inviteMode: modeSummary.mode,
    modeLabel: modeSummary.modeLabel,
    modeDescription: modeSummary.modeDescription,
    navPreview: modeSummary.navPreview,
    repoActions: modeSummary.repoActions,
    status: expired ? "expired" : invite.status,
    expiresAt: invite.expiresAt,
    projects: projects.map((p) => ({ id: p.id, name: p.name, slug: p.slug })),
  };
}
