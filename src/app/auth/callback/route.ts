import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAppUrl } from "@/lib/integrations/config";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${getAppUrl()}/login?error=supabase_not_configured`);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${getAppUrl()}/login?error=missing_code`);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${getAppUrl()}/login?error=supabase_unavailable`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${getAppUrl()}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${getAppUrl()}${next.startsWith("/") ? next : `/${next}`}`);
}
