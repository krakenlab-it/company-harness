import { Resend } from "resend";
import { getAppUrl } from "@/lib/integrations/config";
import type { Project, TeamInvite, TeamMemberRole } from "@/lib/types";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
}

export function buildInviteUrl(token: string): string {
  return `${getAppUrl()}/join?token=${encodeURIComponent(token)}`;
}

export function buildInviteEmailHtml(options: {
  inviteeName?: string;
  inviterName?: string;
  role: TeamMemberRole;
  projects: Pick<Project, "name">[];
  acceptUrl: string;
}): string {
  const projectList =
    options.projects.length > 0
      ? options.projects.map((p) => `<li>${p.name}</li>`).join("")
      : "<li>Team workspace (no specific projects yet)</li>";

  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
      <h1 style="color: #0d9488;">You're invited to KrakenLab Harness</h1>
      <p>Hi ${options.inviteeName ?? "there"},</p>
      <p>${options.inviterName ?? "A team admin"} invited you to join KrakenLab Media's harness as <strong>${options.role}</strong>.</p>
      <p>You'll get access to:</p>
      <ul>${projectList}</ul>
      <p>
        <a href="${options.acceptUrl}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          Accept invite &amp; join team
        </a>
      </p>
      <p style="color:#64748b;font-size:14px;">This link expires in 7 days. If you didn't expect this email, you can ignore it.</p>
    </div>
  `;
}

export async function sendTeamInviteEmail(options: {
  invite: TeamInvite;
  projects: Pick<Project, "name">[];
  inviterName?: string;
}): Promise<{ messageId?: string; acceptUrl: string }> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not configured");
  }

  const resend = getResendClient();
  const acceptUrl = buildInviteUrl(options.invite.token);

  const { data, error } = await resend.emails.send(
    {
      from,
      to: [options.invite.email],
      subject: `Join KrakenLab Harness — ${options.invite.role} access`,
      html: buildInviteEmailHtml({
        inviteeName: options.invite.name,
        inviterName: options.inviterName,
        role: options.invite.role,
        projects: options.projects,
        acceptUrl,
      }),
    },
    { idempotencyKey: `team-invite/${options.invite.id}` },
  );

  if (error) {
    throw new Error(error.message);
  }

  return { messageId: data?.id, acceptUrl };
}

export function isResendConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim(),
  );
}
