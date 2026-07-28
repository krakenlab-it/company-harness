import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import type { RepoAction, TeamMemberRole } from "@/lib/types";

function toApiBudget(budget: ReturnType<typeof store.getBudget>) {
  if (!budget) return budget;
  return {
    id: budget.id,
    name: budget.category,
    category: budget.category,
    monthlyLimit: budget.monthlyLimitUsd,
    monthlyLimitUsd: budget.monthlyLimitUsd,
    currentSpend: budget.spentUsd,
    spentUsd: budget.spentUsd,
    alertThreshold: budget.alertThresholdPct,
    alertThresholdPct: budget.alertThresholdPct,
  };
}

export async function GET() {
  try {
    const members = store.listMembers();
    const repos = store.listRepos();
    const budgets = store.listBudgets().map((b) => toApiBudget(b)!);

    return NextResponse.json({ members, repos, budgets });
  } catch {
    return jsonError("Failed to load team data");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<Record<string, unknown>>(request);
    if (!body) {
      return jsonError("Invalid JSON body", 400);
    }

    const kind = (body.kind ?? body.type) as string | undefined;

    if (kind === "member") {
      if (!body.name || typeof body.name !== "string") {
        return jsonError("name is required", 400);
      }

      const member = store.createMember({
        name: body.name.trim(),
        email: typeof body.email === "string" ? body.email : "",
        role: (body.role as TeamMemberRole) ?? "dev",
        avatar: typeof body.avatar === "string" ? body.avatar : undefined,
      });

      return NextResponse.json({ member }, { status: 201 });
    }

    if (kind === "repo") {
      if (!body.name || typeof body.name !== "string") {
        return jsonError("name is required", 400);
      }

      const repo = store.createRepo({
        name: body.name.trim(),
        url: typeof body.url === "string" ? body.url : `https://github.com/${body.name}`,
        allowedActions: (body.allowedActions as RepoAction[]) ?? ["read"],
        budgetUsdMonthly:
          typeof body.budgetUsdMonthly === "number"
            ? body.budgetUsdMonthly
            : 0,
        enabled: body.enabled !== false,
      });

      return NextResponse.json({ repo }, { status: 201 });
    }

    if (kind === "budget") {
      if (!body.name && !body.category) {
        return jsonError("name or category is required", 400);
      }

      const budget = store.createBudget({
        category:
          typeof body.name === "string"
            ? body.name
            : (body.category as string),
        monthlyLimitUsd:
          typeof body.monthlyLimit === "number"
            ? body.monthlyLimit
            : typeof body.monthlyLimitUsd === "number"
              ? body.monthlyLimitUsd
              : 0,
        spentUsd:
          typeof body.currentSpend === "number"
            ? body.currentSpend
            : typeof body.spentUsd === "number"
              ? body.spentUsd
              : 0,
        alertThresholdPct:
          typeof body.alertThreshold === "number"
            ? body.alertThreshold
            : typeof body.alertThresholdPct === "number"
              ? body.alertThresholdPct
              : 80,
      });

      return NextResponse.json({ budget: toApiBudget(budget) }, { status: 201 });
    }

    return jsonError("kind must be 'member', 'repo', or 'budget'", 400);
  } catch {
    return jsonError("Failed to create team record");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await parseJsonBody<Record<string, unknown>>(request);
    if (!body) {
      return jsonError("Invalid JSON body", 400);
    }

    const kind = (body.kind ?? body.type) as string | undefined;

    if (kind === "repo") {
      if (!body.id || typeof body.id !== "string") {
        return jsonError("id is required", 400);
      }

      const repo = store.updateRepo(body.id, {
        allowedActions: body.allowedActions as RepoAction[] | undefined,
        enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
        name: typeof body.name === "string" ? body.name : undefined,
        url: typeof body.url === "string" ? body.url : undefined,
        budgetUsdMonthly:
          typeof body.budgetUsdMonthly === "number"
            ? body.budgetUsdMonthly
            : undefined,
      });

      if (!repo) {
        return jsonError("Repository not found", 404);
      }

      return NextResponse.json({ repo });
    }

    if (kind === "budget") {
      const id = typeof body.id === "string" ? body.id : undefined;
      const name =
        typeof body.name === "string" ? body.name : undefined;

      let budgetId = id;
      if (!budgetId && name) {
        budgetId = store.listBudgets().find((b) => b.category === name)?.id;
      }

      if (!budgetId) {
        return jsonError("id or name is required", 400);
      }

      const patch: Record<string, unknown> = {};
      if (name) patch.category = name;
      if (typeof body.monthlyLimit === "number") {
        patch.monthlyLimitUsd = body.monthlyLimit;
      } else if (typeof body.monthlyLimitUsd === "number") {
        patch.monthlyLimitUsd = body.monthlyLimitUsd;
      }
      if (typeof body.alertThreshold === "number") {
        patch.alertThresholdPct = body.alertThreshold;
      } else if (typeof body.alertThresholdPct === "number") {
        patch.alertThresholdPct = body.alertThresholdPct;
      }
      if (typeof body.currentSpend === "number") {
        patch.spentUsd = body.currentSpend;
      } else if (typeof body.spentUsd === "number") {
        patch.spentUsd = body.spentUsd;
      }

      const budget = store.updateBudget(budgetId, patch);
      if (!budget) {
        return jsonError("Budget not found", 404);
      }

      return NextResponse.json({ budget: toApiBudget(budget) });
    }

    if (kind === "member") {
      if (!body.id || typeof body.id !== "string") {
        return jsonError("id is required", 400);
      }

      const member = store.updateMember(body.id, {
        name: typeof body.name === "string" ? body.name : undefined,
        email: typeof body.email === "string" ? body.email : undefined,
        role: body.role as TeamMemberRole | undefined,
        avatar: typeof body.avatar === "string" ? body.avatar : undefined,
      });

      if (!member) {
        return jsonError("Member not found", 404);
      }

      return NextResponse.json({ member });
    }

    return jsonError("kind must be 'member', 'repo', or 'budget'", 400);
  } catch {
    return jsonError("Failed to update team record");
  }
}
