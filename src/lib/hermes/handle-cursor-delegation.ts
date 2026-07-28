import type { CursorAgentJob } from "@/lib/types";
import type { HarnessSession } from "@/lib/auth/permissions";
import {
  memberCanDelegate,
  memberHasRepoAccess,
  requireRepoAccess,
} from "@/lib/auth/permissions";
import { delegateToCursor } from "@/lib/cursor/client";
import { store } from "@/lib/store/memory-store";
import {
  parseCursorCommand,
  resolveRepoUrlForCursor,
} from "@/lib/hermes/cursor-command";

export interface HermesCursorDelegationResult {
  text: string;
  job?: CursorAgentJob;
  error?: string;
}

export async function handleHermesCursorCommand(
  session: HarnessSession,
  message: string,
  scopedRepo?: string | null,
): Promise<HermesCursorDelegationResult> {
  const parsed = parseCursorCommand(message);
  if (!parsed) {
    const text =
      "Could not parse `@cursor` command. Example: `@cursor Add login rate limiting`";
    store.addHermesMessage({
      channel: "in_app",
      role: "user",
      content: message,
    });
    store.addHermesMessage({
      channel: "in_app",
      role: "assistant",
      content: text,
    });
    return { text, error: "invalid_command" };
  }

  if (!memberCanDelegate(session)) {
    const text =
      "Only **admin** or **lead** roles can delegate Cursor agents. Ask an admin to use `@cursor` or the Agents page.";
    store.addHermesMessage({
      channel: "in_app",
      role: "user",
      content: message,
    });
    store.addHermesMessage({
      channel: "in_app",
      role: "assistant",
      content: text,
    });
    return { text, error: "forbidden_role" };
  }

  const repo = resolveRepoUrlForCursor(session.memberId, scopedRepo);
  if (!repo) {
    const text = scopedRepo
      ? `No **agents** permission on \`${scopedRepo}\`. Select a repo you can delegate on, or ask an admin to update Team & Access.`
      : "Pick a repo scope (repo filter or `?repo=`) before `@cursor`, or ensure you have **agents** permission on at least one repo.";
    store.addHermesMessage({
      channel: "in_app",
      role: "user",
      content: message,
    });
    store.addHermesMessage({
      channel: "in_app",
      role: "assistant",
      content: text,
    });
    return { text, error: "no_repo" };
  }

  try {
    requireRepoAccess(session, repo.url, "agents");
  } catch {
    const text = `You don't have **agents** permission on \`${repo.name}\`.`;
    store.addHermesMessage({
      channel: "in_app",
      role: "user",
      content: message,
    });
    store.addHermesMessage({
      channel: "in_app",
      role: "assistant",
      content: text,
    });
    return { text, error: "forbidden_repo" };
  }

  const job = await delegateToCursor({
    type: parsed.type,
    title: parsed.title,
    prompt: parsed.prompt,
    repo: repo.url,
    actorId: session.memberId,
    source: "hermes",
  });

  const dashboardUrl = job.cursorAgentId
    ? `https://cursor.com/agents?id=${job.cursorAgentId}`
    : null;

  const lines = [
    `Delegated to **Cursor Cloud Agent** on \`${repo.name}\`.`,
    "",
    `- **Job:** ${job.title}`,
    `- **Type:** ${parsed.type}`,
    `- **Status:** ${job.status}`,
    job.cursorAgentId
      ? `- **Cursor ID:** \`${job.cursorAgentId}\``
      : "- **Cursor ID:** pending (local queue or API sync)",
    job.prUrl ? `- **PR:** ${job.prUrl}` : null,
    dashboardUrl ? `- **Track:** ${dashboardUrl}` : null,
    "",
    "Hermes will refresh status automatically while this mission runs.",
  ].filter(Boolean);

  store.addHermesMessage({
    channel: "in_app",
    role: "user",
    content: message,
  });

  store.addHermesMessage({
    channel: "in_app",
    role: "assistant",
    content: lines.join("\n"),
    contextType: "agent_job",
    contextId: job.id,
  });

  store.addActivity({
    entityType: "hermes",
    entityId: job.id,
    action: "cursor_delegated",
    summary: `Hermes @cursor → ${parsed.title}`,
    actorId: session.memberId,
  });

  return { text: lines.join("\n"), job };
}
