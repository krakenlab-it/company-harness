import { store } from "@/lib/store/memory-store";
import type { TeamInvite, TeamMemberRole } from "@/lib/types";
import {
  sendTeamInviteEmail,
  buildInviteUrl,
  isResendConfigured,
} from "@/lib/integrations/resend-invites";

const INVITE_TTL_DAYS = 7;

export async function createTeamInviteAsync(input: {
  email: string;
  name?: string;
  role: TeamMemberRole;
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

  const expiresAt = new Date(
    Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const invite = store.createTeamInvite({
    email: input.email.toLowerCase(),
    name: input.name,
    role: input.role,
    projectIds: input.projectIds,
    invitedById: input.invitedById,
    expiresAt,
  });

  for (const projectId of input.projectIds) {
    store.createProjectAssignment({
      projectId,
      email: invite.email,
      role: input.role,
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
    summary: `Invited ${invite.email} as ${invite.role}`,
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

  const existing = store.getMemberByEmail(invite.email);
  if (existing) {
    store.updateTeamInvite(invite.id, {
      status: "accepted",
      acceptedAt: new Date().toISOString(),
    });
    return {
      member: existing,
      invite: store.getTeamInviteByToken(input.token)!,
    };
  }

  const member = store.createMember({
    name: input.name ?? invite.name ?? invite.email.split("@")[0],
    email: invite.email,
    role: invite.role,
    authUserId: input.authUserId,
  });

  store.addActivity({
    entityType: "team_member",
    entityId: member.id,
    action: "joined",
    summary: `${member.name} joined the team via invite`,
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

  return {
    email: invite.email,
    name: invite.name,
    role: invite.role,
    status: expired ? "expired" : invite.status,
    expiresAt: invite.expiresAt,
    projects: projects.map((p) => ({ id: p.id, name: p.name, slug: p.slug })),
  };
}
