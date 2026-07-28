import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { PREFERRED_STACK } from "@/lib/guidelines/stack-guidelines";
import { jsonError } from "@/lib/api/response";

export async function GET() {
  try {
    await requireAuth();
    return NextResponse.json({
      guidelines: PREFERRED_STACK,
      ...PREFERRED_STACK,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to load guidelines");
  }
}
