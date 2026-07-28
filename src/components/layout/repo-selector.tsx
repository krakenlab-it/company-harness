"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepoOption {
  id: string;
  name: string;
  url: string;
}

export function RepoSelector({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [repos, setRepos] = useState<RepoOption[]>([]);
  const selected = searchParams.get("repo") ?? "";

  useEffect(() => {
    fetch("/api/access/repos")
      .then((r) => r.json())
      .then((d) => setRepos(d.repos ?? []))
      .catch(() => setRepos([]));
  }, []);

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("repo", value);
    else params.delete("repo");
    router.push(`?${params.toString()}`);
  }

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <label htmlFor="repo-selector" className="sr-only">
        Filter by repository
      </label>
      <select
        id="repo-selector"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="input appearance-none pr-8 text-xs py-1.5 min-w-[160px]"
      >
        <option value="">All repos</option>
        {repos.map((r) => (
          <option key={r.id} value={r.name}>
            {r.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-mist"
        aria-hidden
      />
    </div>
  );
}
