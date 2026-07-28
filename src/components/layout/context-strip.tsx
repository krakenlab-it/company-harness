"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";

function ContextStripInner() {
  const searchParams = useSearchParams();
  const repo = searchParams.get("repo");

  return (
    <div className="context-strip">
      <span className="uppercase tracking-wider font-semibold text-sand">
        Scope
      </span>
      {repo ? (
        <span className="context-chip">{repo}</span>
      ) : (
        <span className="context-chip text-mist">ALL REPOS</span>
      )}
      <span className="hidden sm:inline text-sand">→</span>
      <Link
        href={repo ? `/hermes?repo=${encodeURIComponent(repo)}` : "/hermes"}
        className="action-link inline-flex items-center gap-1"
      >
        Run intel
        <ArrowRight className="h-3 w-3" />
      </Link>
      <Link
        href={repo ? `/agents?repo=${encodeURIComponent(repo)}` : "/agents"}
        className="action-link inline-flex items-center gap-1"
      >
        Delegate
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

export function ContextStrip() {
  return (
    <Suspense fallback={null}>
      <ContextStripInner />
    </Suspense>
  );
}
