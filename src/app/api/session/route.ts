import { NextResponse } from "next/server";
import {
  requireAuth,
  hasAnyAgentsPermission,
  canManageAccess,
  canAccessIntegrations,
  canAccessMarketing,
  canRequestMarketingTasks,
  canManageMarketingTasks,
  AuthError,
} from "@/lib/auth";
import { jsonError } from "@/lib/api/response";

export async function GET() {
  try {
    const session = await requireAuth();
    return NextResponse.json({
      memberId: session.memberId,
      name: session.name,
      email: session.email,
      role: session.role,
      canDelegate: hasAnyAgentsPermission(session.memberId),
      canManageAccess: canManageAccess(session),
      canAccessIntegrations: canAccessIntegrations(session),
      canAccessMarketing: canAccessMarketing(session),
      canRequestMarketing: canRequestMarketingTasks(session),
      canManageMarketing: canManageMarketingTasks(session),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to load session");
  }
}
