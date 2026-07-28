import type {
  MemberViewSettings,
  RepoAction,
  TeamMember,
  TeamMemberRole,
  TeamRepo,
} from "@/lib/types";
import { store } from "@/lib/store/memory-store";
import { DEMO_MEMBER_ID, isDemoMode } from "@/lib/auth/config";
import { createClient } from "@/lib/supabase/server";
import { resolveMemberViewSettings } from "@/lib/team/invite-modes";

export interface HarnessSession {
  authUserId: string | null;
  memberId: string;
  email: string;
  name: string;
  role: TeamMemberRole;
  member: TeamMember;
}

function normalizeRepoUrl(url: string): string {
  return url.replace(/\.git$/, "").replace(/\/$/, "").toLowerCase();
}

export async function getSession(): Promise<HarnessSession | null> {
  if (isDemoMode()) {
    const member = store.getMember(DEMO_MEMBER_ID) ?? store.listMembers()[0];
    if (!member) return null;
    return {
      authUserId: null,
      memberId: member.id,
      email: member.email,
      name: member.name,
      role: member.role,
      member,
    };
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return null;

  const member =
    store.listMembers().find((m) => m.authUserId === user.id) ??
    store.getMemberByEmail(user.email ?? "");

  if (!member) return null;

  return {
    authUserId: user.id,
    memberId: member.id,
    email: member.email,
    name: member.name,
    role: member.role,
    member,
  };
}

export async function requireAuth(): Promise<HarnessSession> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized", 401);
  }
  return session;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function requireRole(
  session: HarnessSession,
  roles: TeamMemberRole[],
): void {
  if (!roles.includes(session.role)) {
    throw new AuthError("Forbidden: insufficient role", 403);
  }
}

export function isAdmin(session: HarnessSession): boolean {
  return session.role === "admin";
}

export function memberCanDelegate(session: HarnessSession): boolean {
  return session.role === "admin" || session.role === "lead";
}

export function canManageAccess(session: HarnessSession): boolean {
  return session.role === "admin";
}

export function getSessionViewSettings(
  session: HarnessSession,
): MemberViewSettings {
  return resolveMemberViewSettings(session.member);
}

export function canViewNavArea(
  session: HarnessSession,
  area: keyof MemberViewSettings,
): boolean {
  const settings = getSessionViewSettings(session);
  return settings[area];
}

export function canAccessMarketing(session: HarnessSession): boolean {
  if (!canViewNavArea(session, "marketing")) {
    return false;
  }
  return (
    session.role === "admin" ||
    session.role === "lead" ||
    session.role === "dev" ||
    session.role === "marketing"
  );
}

export function canRequestMarketingTasks(session: HarnessSession): boolean {
  return canAccessMarketing(session);
}

export function canManageMarketingTasks(session: HarnessSession): boolean {
  return session.role === "admin" || session.role === "marketing";
}

export function getMemberRepoActions(
  memberId: string,
  repoId: string,
): RepoAction[] {
  const member = store.getMember(memberId);
  if (member?.role === "admin") {
    return ["read", "write", "agents", "deploy", "secrets"];
  }

  const access = store.getRepoAccess(memberId, repoId);
  return access?.actions ?? [];
}

export function memberHasRepoAccess(
  memberId: string,
  repoUrl: string,
  action: RepoAction = "read",
): boolean {
  const member = store.getMember(memberId);
  if (member?.role === "admin") return true;

  const repo = store.findRepoByUrl(repoUrl);
  if (!repo) return false;

  const actions = getMemberRepoActions(memberId, repo.id);
  return actions.includes(action);
}

export function requireRepoAccess(
  session: HarnessSession,
  repoUrl: string | undefined,
  action: RepoAction = "read",
): void {
  if (!repoUrl) {
    throw new AuthError("repo is required", 400);
  }
  if (!memberHasRepoAccess(session.memberId, repoUrl, action)) {
    throw new AuthError(`Forbidden: no '${action}' access on repo`, 403);
  }
}

export function getVisibleRepos(memberId: string): TeamRepo[] {
  const member = store.getMember(memberId);
  if (!member) return [];

  if (member.role === "admin") {
    return store.listRepos().filter((r) => r.enabled);
  }

  const accessList = store.listRepoAccessForMember(memberId);
  const repoIds = new Set(accessList.map((a) => a.repoId));
  return store
    .listRepos()
    .filter((r) => r.enabled && repoIds.has(r.id));
}

export function getVisibleRepoUrls(memberId: string): string[] {
  return getVisibleRepos(memberId).map((r) => r.url);
}

export function filterByVisibleRepos<T extends { repoUrl?: string; url?: string; repo?: string }>(
  memberId: string,
  items: T[],
  urlKey: keyof T = "repoUrl" as keyof T,
): T[] {
  const member = store.getMember(memberId);
  if (member?.role === "admin") return items;

  const visible = new Set(
    getVisibleRepoUrls(memberId).map((u) => normalizeRepoUrl(u)),
  );
  if (visible.size === 0) return [];

  return items.filter((item) => {
    const raw = (item[urlKey] ?? item.url ?? item.repo) as string | undefined;
    if (!raw) return true;
    return visible.has(normalizeRepoUrl(raw));
  });
}

export function canAccessIntegrations(session: HarnessSession): boolean {
  if (!canViewNavArea(session, "integrations")) {
    return false;
  }
  return session.role === "admin" || session.role === "lead";
}

export function hasAnyAgentsPermission(memberId: string): boolean {
  const member = store.getMember(memberId);
  if (!member) return false;

  const viewSettings = resolveMemberViewSettings(member);
  if (!viewSettings.agents) return false;

  if (member.role === "admin" || member.role === "lead") {
    return getVisibleRepos(memberId).some((repo) =>
      memberHasRepoAccess(memberId, repo.url, "agents"),
    );
  }
  return store.listRepoAccessForMember(memberId).some((a) =>
    a.actions.includes("agents"),
  );
}
