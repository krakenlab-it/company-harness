import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import {
  analyzePackageJson,
  analyzeProjectStack,
  scoreStackHealth,
} from "@/lib/stack/analyzer";
import { jsonError, parseJsonBody } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const projectId = request.nextUrl.searchParams.get("projectId") ?? undefined;
    const dependencies = analyzeProjectStack(projectId);
    const health = scoreStackHealth(projectId);

    return NextResponse.json({
      dependencies,
      deps: dependencies,
      health,
    });
  } catch {
    return jsonError("Failed to analyze stack");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await parseJsonBody<{
      packageJson?: {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      projectId?: string;
    }>(request);

    if (!body?.packageJson) {
      return jsonError("packageJson is required", 400);
    }

    const dependencies = analyzeProjectStack(body.projectId, body.packageJson);
    const health = scoreStackHealth(body.projectId);

    return NextResponse.json({
      dependencies,
      deps: dependencies,
      health,
    });
  } catch {
    return jsonError("Failed to analyze package.json");
  }
}
