import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  if (!browserClient) {
    browserClient = createBrowserClient(
      supabaseConfig.url,
      supabaseConfig.anonKey,
    );
  }

  return browserClient;
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  return createClient();
}
