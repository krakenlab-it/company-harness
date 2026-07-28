import type { HarnessSession } from "@/lib/auth/permissions";
import { canRequestMarketingTasks } from "@/lib/auth/permissions";
import { buildMarketingTaskDraft } from "@/lib/marketing/task-templates";
import { parseMarketingCommand } from "@/lib/marketing/marketing-command";
import { store } from "@/lib/store/memory-store";
import type { MarketingTask, MarketingTaskCategory } from "@/lib/types";

export interface MarketingRequestResult {
  text: string;
  task?: MarketingTask;
  error?: string;
}

export function createMarketingTaskFromInput(options: {
  session: HarnessSession;
  category: MarketingTaskCategory;
  title: string;
  brief: string;
  projectId?: string;
  targetUrl?: string;
  priority?: MarketingTask["priority"];
  source: MarketingTask["source"];
}): MarketingTask {
  const draft = buildMarketingTaskDraft({
    category: options.category,
    title: options.title,
    brief: options.brief,
    projectId: options.projectId,
    targetUrl: options.targetUrl,
    requesterName: options.session.name,
  });

  const task = store.createMarketingTask({
    title: draft.title,
    brief: draft.brief,
    category: options.category,
    status: "requested",
    priority: options.priority ?? draft.priority,
    requesterId: options.session.memberId,
    projectId: options.projectId,
    targetUrl: options.targetUrl,
    labels: draft.labels,
    source: options.source,
  });

  store.addActivity({
    projectId: options.projectId,
    entityType: "marketing_task",
    entityId: task.id,
    action: "requested",
    summary: `Marketing request: ${task.title}`,
    actorId: options.session.memberId,
  });

  return task;
}

export async function handleHermesMarketingCommand(
  session: HarnessSession,
  message: string,
  projectId?: string | null,
): Promise<MarketingRequestResult> {
  const parsed = parseMarketingCommand(message);
  if (!parsed) {
    const text =
      "Could not parse `@marketing` command. Example: `@marketing ui_redesign: Refresh the repo page for non-technical users`";
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

  if (!canRequestMarketingTasks(session)) {
    const text =
      "Your role cannot request marketing work. Ask an admin, developer, or marketing teammate to submit this request.";
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

  const task = createMarketingTaskFromInput({
    session,
    category: parsed.category,
    title: parsed.title,
    brief: parsed.brief,
    projectId: projectId ?? undefined,
    source: "hermes",
  });

  const lines = [
    `Sent to the **marketing team** — they'll pick this up in Marketing Studio.`,
    "",
    `- **Request:** ${task.title}`,
    `- **Type:** ${task.category.replace(/_/g, " ")}`,
    `- **Status:** ${task.status}`,
    `- **ID:** \`${task.id}\``,
    "",
    "Track progress on the **Marketing** page or ask Hermes for open marketing tasks.",
  ];

  store.addHermesMessage({
    channel: "in_app",
    role: "user",
    content: message,
  });

  store.addHermesMessage({
    channel: "in_app",
    role: "assistant",
    content: lines.join("\n"),
    contextType: "marketing_task",
    contextId: task.id,
  });

  return { text: lines.join("\n"), task };
}
