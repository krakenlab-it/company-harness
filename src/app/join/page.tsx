"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface InviteView {
  email: string;
  name?: string;
  role: string;
  status: string;
  expiresAt: string;
  projects: { id: string; name: string; slug: string }[];
}

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [invite, setInvite] = useState<InviteView | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const supabaseConfigured = Boolean(
    typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Missing invite token");
      return;
    }

    fetch(`/api/team/invites/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setInvite(data.invite);
        if (data.invite?.name) setName(data.invite.name);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Invalid invite"),
      )
      .finally(() => setLoading(false));
  }, [token]);

  async function acceptInvite() {
    if (!token) return;
    setAccepting(true);
    setError(null);

    try {
      const res = await fetch(`/api/team/invites/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to accept invite");
      router.push(data.redirectTo ?? "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept");
    } finally {
      setAccepting(false);
    }
  }

  async function loginThenJoin() {
    if (!token) return;
    const next = `/join?token=${encodeURIComponent(token)}`;

    if (!supabaseConfigured) {
      await acceptInvite();
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase auth is not available");
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (authError) {
      setError(authError.message);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-mist">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error && !invite) {
    return (
      <Panel className="max-w-md mx-auto p-6 text-center">
        <p className="text-rose-400 mb-4">{error}</p>
        <Link href="/login">
          <Button variant="outline">Go to login</Button>
        </Link>
      </Panel>
    );
  }

  if (!invite) return null;

  const canAccept = invite.status === "pending";

  return (
    <Panel className="max-w-lg mx-auto p-6 space-y-4">
      <div>
        <h1 className="text-xl font-display font-bold text-foam">Join KrakenLab Harness</h1>
        <p className="text-sm text-mist mt-1">
          You&apos;ve been invited as <Badge>{invite.role}</Badge>
        </p>
      </div>

      <div className="text-sm space-y-1">
        <p>
          <span className="text-mist">Email:</span> {invite.email}
        </p>
        <p>
          <span className="text-mist">Expires:</span>{" "}
          {new Date(invite.expiresAt).toLocaleDateString()}
        </p>
      </div>

      {invite.projects.length > 0 && (
        <div>
          <p className="text-sm text-mist mb-2">Projects you&apos;ll access:</p>
          <ul className="text-sm space-y-1">
            {invite.projects.map((p) => (
              <li key={p.id} className="text-foam">
                {p.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!canAccept && (
        <p className="text-rose-400 text-sm">This invite is {invite.status}.</p>
      )}

      {canAccept && (
        <>
          <label className="block text-sm">
            <span className="text-mist">Your name</span>
            <input
              className="mt-1 w-full rounded-lg border border-[rgba(122,154,171,0.2)] bg-ocean px-3 py-2 text-foam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How you'll appear on the team"
            />
          </label>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={loginThenJoin} disabled={accepting}>
              {accepting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : supabaseConfigured ? (
                "Sign in with Google & join"
              ) : (
                "Accept & join team"
              )}
            </Button>
            {supabaseConfigured && (
              <Link href={`/login?next=${encodeURIComponent(`/join?token=${token}`)}`}>
                <Button variant="outline" className="w-full">
                  Email login
                </Button>
              </Link>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-ocean flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="text-mist">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        }
      >
        <JoinContent />
      </Suspense>
    </div>
  );
}
