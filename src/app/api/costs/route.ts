import { NextRequest, NextResponse } from "next/server";
import { getCostRollup } from "@/lib/stack/analyzer";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import type { ProviderCost, ProviderName } from "@/lib/types";

function toApiCost(cost: ProviderCost) {
  return {
    id: cost.id,
    provider: cost.provider,
    name: cost.name,
    monthlyBudget: cost.monthlyBudgetUsd,
    actualSpend: cost.actualSpendUsd,
    monthlyBudgetUsd: cost.monthlyBudgetUsd,
    actualSpendUsd: cost.actualSpendUsd,
    notes: cost.notes,
    updatedAt: cost.updatedAt,
  };
}

export async function GET() {
  try {
    const costs = store.listCosts().map(toApiCost);
    const rollup = getCostRollup();

    return NextResponse.json({
      costs,
      providers: costs,
      rollup,
    });
  } catch {
    return jsonError("Failed to list costs");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<{
      provider?: string;
      name?: string;
      monthlyBudget?: number;
      monthlyBudgetUsd?: number;
      actualSpend?: number;
      actualSpendUsd?: number;
      notes?: string;
    }>(request);

    if (!body?.provider) {
      return jsonError("provider is required", 400);
    }

    const cost = store.createCost({
      provider: body.provider as ProviderName,
      name: body.name ?? body.provider,
      monthlyBudgetUsd: body.monthlyBudgetUsd ?? body.monthlyBudget ?? 0,
      actualSpendUsd: body.actualSpendUsd ?? body.actualSpend ?? 0,
      notes: body.notes,
    });

    return NextResponse.json({ cost: toApiCost(cost) }, { status: 201 });
  } catch {
    return jsonError("Failed to create cost entry");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await parseJsonBody<{
      id?: string;
      provider?: string;
      name?: string;
      monthlyBudget?: number;
      monthlyBudgetUsd?: number;
      actualSpend?: number;
      actualSpendUsd?: number;
      notes?: string;
    }>(request);

    if (!body?.id) {
      return jsonError("id is required", 400);
    }

    const patch: Partial<ProviderCost> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.monthlyBudgetUsd !== undefined) {
      patch.monthlyBudgetUsd = body.monthlyBudgetUsd;
    } else if (body.monthlyBudget !== undefined) {
      patch.monthlyBudgetUsd = body.monthlyBudget;
    }
    if (body.actualSpendUsd !== undefined) {
      patch.actualSpendUsd = body.actualSpendUsd;
    } else if (body.actualSpend !== undefined) {
      patch.actualSpendUsd = body.actualSpend;
    }

    const cost = store.updateCost(body.id, patch);
    if (!cost) {
      return jsonError("Cost entry not found", 404);
    }

    return NextResponse.json({ cost: toApiCost(cost) });
  } catch {
    return jsonError("Failed to update cost entry");
  }
}
