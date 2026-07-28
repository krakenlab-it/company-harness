"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const authError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(authError);

  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );

  async function signInWithGoogle() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured — use dev join without login");
      return;
    }
    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (err) setError(err.message);
    setLoading(false);
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured");
      return;
    }
    setLoading(true);
    setError(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (err) {
      setError(err.message);
    } else {
      setMessage("Check your email for a magic link to sign in.");
    }
    setLoading(false);
  }

  return (
    <Panel className="w-full max-w-md p-6 space-y-4">
      <div>
        <h1 className="text-xl font-display font-bold text-foam">Sign in</h1>
        <p className="text-sm text-mist">Access KrakenLab Harness</p>
      </div>

      {!supabaseConfigured && (
        <p className="text-sm text-amber-300/90 rounded-lg bg-amber-500/10 p-3">
          Supabase auth is not configured. In local demo mode you can accept team
          invites directly from the join link without logging in.
        </p>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {message && <p className="text-sm text-teal-bright">{message}</p>}

      {supabaseConfigured && (
        <>
          <Button className="w-full" onClick={signInWithGoogle} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue with Google"}
          </Button>

          <div className="relative text-center text-xs text-mist">
            <span className="bg-ocean-subtle px-2 relative z-10">or email magic link</span>
            <div className="absolute inset-x-0 top-1/2 border-t border-[rgba(122,154,171,0.15)]" />
          </div>

          <form onSubmit={signInWithEmail} className="space-y-3">
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="outline" className="w-full" disabled={loading}>
              Send magic link
            </Button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-mist">
        <Link href="/" className="text-teal-bright hover:underline">
          Back to harness
        </Link>
      </p>
    </Panel>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-ocean flex items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-mist" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
