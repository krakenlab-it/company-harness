import { NextResponse } from "next/server";
import {
  AuthError,
  requireAuth,
  type HarnessSession,
} from "@/lib/auth/permissions";
import { jsonError } from "@/lib/api/response";

export async function withRequiredAuth(
  handler: (session: HarnessSession) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    return await handler(session);
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    throw error;
  }
}

export function catchAuthError(error: unknown): NextResponse | null {
  if (error instanceof AuthError) {
    return jsonError(error.message, error.status);
  }
  return null;
}
