import { NextResponse } from "next/server";
import { PREFERRED_STACK } from "@/lib/guidelines/stack-guidelines";
import { jsonError } from "@/lib/api/response";

export async function GET() {
  try {
    return NextResponse.json({
      guidelines: PREFERRED_STACK,
      ...PREFERRED_STACK,
    });
  } catch {
    return jsonError("Failed to load guidelines");
  }
}
