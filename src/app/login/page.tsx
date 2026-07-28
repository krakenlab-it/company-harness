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
    <Panel className="w-full max-w-sm p-8 space-y-5 shadow-none">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-display font-semibold tracking-tight text-foam">
          Sign in
        </h1>
        <p className="text-sm text-mist">KrakenLab Company OS</p>
      </div>

      {!supabaseConfigured && (
        <p className="text-sm text-mist rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] p-3 leading-relaxed">
          Auth is not configured. In demo mode, accept team invites from the
          join link without signing in.
        </p>
      )}

      {error && <p className="text-sm text-danger text-center">{error}</p>}
      {message && <p className="text-sm text-foam text-center">{message}</p>}

      {supabaseConfigured && (
        <>
          <Button className="w-full" onClick={signInWithGoogle} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Continue with Google"
            )}
          </Button>

          <div className="relative text-center text-xs text-sand">
            <span className="bg-[var(--canvas)] px-2 relative z-10">
              or magic link
            </span>
            <div className="absolute inset-x-0 top-1/2 border-t border-[var(--border-subtle)]" />
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

      <p className="text-center text-xs text-mist">
        <Link href="/" className="text-foam hover:underline">
          Continue without signing in →
        </Link>
      </p>
    </Panel>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col items-center justify-center p-6">
      <Suspense
        fallback={<Loader2 className="h-5 w-5 animate-spin text-mist" />}
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
