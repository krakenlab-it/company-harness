import type {
  InviteMode,
  MemberViewSettings,
  RepoAction,
  TeamInvite,
  TeamMember,
  TeamMemberRole,
} from "@/lib/types";

export interface InviteModePreset {
  mode: Exclude<InviteMode, "custom">;
  label: string;
  description: string;
  defaultRole: TeamMemberRole;
  defaultRepoActions: RepoAction[];
  viewSettings: MemberViewSettings;
}

export const INVITE_MODES: InviteMode[] = [
  "admin",
  "dev",
  "marketing",
  "custom",
];

export const NAV_VIEW_KEYS: (keyof MemberViewSettings)[] = [
  "commandCenter",
  "repos",
  "work",
  "marketing",
  "hermes",
  "agents",
  "integrations",
  "team",
];

export const NAV_VIEW_LABELS: Record<keyof MemberViewSettings, string> = {
  commandCenter: "Command Center",
  repos: "Repos",
  work: "Work",
  marketing: "Marketing Studio",
  hermes: "Hermes",
  agents: "Agents",
  integrations: "Connect",
  team: "Team & Access",
};

const FULL_NAV: MemberViewSettings = {
  commandCenter: true,
  repos: true,
  work: true,
  marketing: true,
  hermes: true,
  agents: true,
  integrations: true,
  team: true,
};

export const INVITE_MODE_PRESETS: Record<
  Exclude<InviteMode, "custom">,
  InviteModePreset
> = {
  admin: {
    mode: "admin",
    label: "Admin",
    description:
      "Full platform access — team settings, integrations, agents, and all repositories.",
    defaultRole: "admin",
    defaultRepoActions: ["read", "write", "agents", "deploy", "secrets"],
    viewSettings: { ...FULL_NAV },
  },
  dev: {
    mode: "dev",
    label: "Developer",
    description:
      "Build and ship — repos, work board, Hermes, and Cursor agents on assigned projects.",
    defaultRole: "dev",
    defaultRepoActions: ["read", "write", "agents", "deploy"],
    viewSettings: {
      commandCenter: true,
      repos: true,
      work: true,
      marketing: true,
      hermes: true,
      agents: true,
      integrations: false,
      team: false,
    },
  },
  marketing: {
    mode: "marketing",
    label: "Marketing",
    description:
      "Creative workspace — Marketing Studio, Hermes @marketing, and project context.",
    defaultRole: "marketing",
    defaultRepoActions: ["read"],
    viewSettings: {
      commandCenter: true,
      repos: false,
      work: true,
      marketing: true,
      hermes: true,
      agents: false,
      integrations: false,
      team: false,
    },
  },
};

export function getInviteModePreset(
  mode: InviteMode,
): InviteModePreset | null {
  if (mode === "custom") return null;
  return INVITE_MODE_PRESETS[mode];
}

export function mergeViewSettings(
  base: MemberViewSettings,
  overrides?: Partial<MemberViewSettings>,
): MemberViewSettings {
  return { ...base, ...(overrides ?? {}) };
}

export function resolveInviteConfig(input: {
  mode: InviteMode;
  role?: TeamMemberRole;
  viewSettings?: Partial<MemberViewSettings>;
  repoActions?: RepoAction[];
}): {
  role: TeamMemberRole;
  viewSettings: MemberViewSettings;
  repoActions: RepoAction[];
} {
  const preset = getInviteModePreset(input.mode);

  if (preset) {
    return {
      role: preset.defaultRole,
      viewSettings: mergeViewSettings(preset.viewSettings, input.viewSettings),
      repoActions: input.repoActions ?? preset.defaultRepoActions,
    };
  }

  const role = input.role ?? "dev";
  const base =
    role === "marketing"
      ? INVITE_MODE_PRESETS.marketing.viewSettings
      : role === "admin"
        ? INVITE_MODE_PRESETS.admin.viewSettings
        : INVITE_MODE_PRESETS.dev.viewSettings;

  return {
    role,
    viewSettings: mergeViewSettings(base, input.viewSettings),
    repoActions: input.repoActions ?? ["read"],
  };
}

export function resolveMemberViewSettings(
  member: Pick<TeamMember, "role" | "inviteMode" | "viewSettings">,
): MemberViewSettings {
  if (member.viewSettings) {
    return member.viewSettings;
  }

  if (member.inviteMode && member.inviteMode !== "custom") {
    return { ...INVITE_MODE_PRESETS[member.inviteMode].viewSettings };
  }

  switch (member.role) {
    case "admin":
      return { ...INVITE_MODE_PRESETS.admin.viewSettings };
    case "lead":
      return mergeViewSettings(INVITE_MODE_PRESETS.dev.viewSettings, {
        integrations: true,
        team: true,
      });
    case "marketing":
      return { ...INVITE_MODE_PRESETS.marketing.viewSettings };
    case "viewer":
      return mergeViewSettings(INVITE_MODE_PRESETS.dev.viewSettings, {
        agents: false,
        integrations: false,
        team: false,
      });
    default:
      return { ...INVITE_MODE_PRESETS.dev.viewSettings };
  }
}

export function listEnabledNavLabels(
  settings: MemberViewSettings,
): string[] {
  return NAV_VIEW_KEYS.filter((key) => settings[key]).map(
    (key) => NAV_VIEW_LABELS[key],
  );
}

export function getInvitePublicModeSummary(
  invite: Pick<
    TeamInvite,
    "inviteMode" | "role" | "viewSettings" | "repoActions"
  >,
): {
  mode: InviteMode;
  modeLabel: string;
  modeDescription: string;
  navPreview: string[];
  repoActions: RepoAction[];
} {
  const mode = invite.inviteMode ?? inferModeFromRole(invite.role);
  const preset = getInviteModePreset(mode);
  const config = resolveInviteConfig({
    mode,
    role: invite.role,
    viewSettings: invite.viewSettings,
    repoActions: invite.repoActions,
  });

  return {
    mode,
    modeLabel:
      mode === "custom" ? "Custom access" : (preset?.label ?? mode),
    modeDescription:
      preset?.description ??
      "Tailored access — your admin picked specific areas and repo permissions.",
    navPreview: listEnabledNavLabels(config.viewSettings),
    repoActions: config.repoActions,
  };
}

function inferModeFromRole(role: TeamMemberRole): InviteMode {
  if (role === "admin") return "admin";
  if (role === "marketing") return "marketing";
  if (role === "dev" || role === "lead") return "dev";
  return "custom";
}
