type ToolResultLike = {
  toolName: string;
  output: unknown;
};

type HermesStep = {
  toolResults?: Array<{ toolName: string; output: unknown }>;
};

type HermesGenerateResult = {
  text: string;
  steps: HermesStep[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function summarizeToolResult(toolName: string, output: unknown): string | null {
  if (output === null || output === undefined) return null;
  const rec = asRecord(output);
  if (rec?.error && typeof rec.error === "string") {
    return `${toolName}: ${rec.error}`;
  }

  switch (toolName) {
    case "create_ticket": {
      if (rec?.title && rec?.id) {
        return `Created ticket **${rec.title}** (\`${rec.id}\`)`;
      }
      break;
    }
    case "create_tickets_for_repos": {
      const created = rec?.created;
      if (Array.isArray(created) && created.length > 0) {
        return created
          .map((item) => {
            const row = asRecord(item);
            const ticket = asRecord(row?.ticket);
            if (row?.repo && ticket?.title && ticket?.id) {
              return `- **${row.repo}**: ${ticket.title} (\`${ticket.id}\`)`;
            }
            return null;
          })
          .filter(Boolean)
          .join("\n");
      }
      break;
    }
    case "update_ticket":
    case "close_ticket":
    case "reopen_ticket": {
      if (rec?.title && rec?.id) {
        return `Updated **${rec.title}** (\`${rec.id}\`) → ${rec.status ?? "changed"}`;
      }
      break;
    }
    case "list_projects": {
      if (Array.isArray(output)) {
        return `Listed ${output.length} project(s)`;
      }
      break;
    }
    case "list_tickets": {
      if (Array.isArray(output)) {
        return `Found ${output.length} ticket(s)`;
      }
      break;
    }
    default:
      break;
  }

  if (Array.isArray(output)) {
    return `${toolName}: ${output.length} result(s)`;
  }
  return `${toolName}: completed`;
}

export function collectToolResultsFromSteps(
  steps: HermesStep[],
): ToolResultLike[] {
  const results: ToolResultLike[] = [];
  for (const step of steps) {
    for (const tr of step.toolResults ?? []) {
      results.push({
        toolName: tr.toolName,
        output: tr.output,
      });
    }
  }
  return results;
}

/** Ensure users always see a reply after multi-step tool runs. */
export function formatHermesReply(result: HermesGenerateResult): string {
  if (result.text?.trim()) {
    return result.text.trim();
  }

  const toolResults = collectToolResultsFromSteps(result.steps);
  if (toolResults.length === 0) {
    return "I finished processing but didn't generate a summary. Please try again or ask me to confirm what was done.";
  }

  const lines = ["Done. Here's what I executed:"];
  for (const tr of toolResults) {
    const summary = summarizeToolResult(tr.toolName, tr.output);
    if (summary) {
      if (summary.includes("\n")) {
        lines.push(summary);
      } else {
        lines.push(`- ${summary}`);
      }
    }
  }

  return lines.join("\n");
}
