import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth/permissions";

export async function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  throw error;
}

export async function withAuth<T>(
  handler: (session: Awaited<ReturnType<typeof requireAuth>>) => Promise<T>,
): Promise<T | NextResponse> {
  try {
    const session = await requireAuth();
    return await handler(session);
  } catch (error) {
    return (await handleAuthError(error)) as NextResponse;
  }
}

export function blockHermesDelegation(request: Request): void {
  const source = request.headers.get("x-harness-source");
  if (source === "hermes") {
    throw new AuthError("Hermes cannot delegate Cursor agents", 403);
  }
}
