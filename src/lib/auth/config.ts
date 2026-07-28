import { isSupabaseConfigured } from "@/lib/supabase/config";

/** When true, APIs use demo admin session and UI skips auth redirect. */
export function isDemoMode(): boolean {
  if (process.env.HARNESS_DEMO_MODE === "true") return true;
  if (process.env.HARNESS_DEMO_MODE === "false") return false;
  return !isSupabaseConfigured();
}

export const DEMO_MEMBER_ID = "member_alex";
