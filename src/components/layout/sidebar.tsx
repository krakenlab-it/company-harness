"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bot,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  MessageSquare,
  Plug,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { RepoSelector } from "@/components/layout/repo-selector";

interface SessionInfo {
  canDelegate: boolean;
  canAccessIntegrations: boolean;
}

const baseNavItems: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  requires?: keyof SessionInfo;
}[] = [
  { href: "/", label: "Command Center", icon: LayoutDashboard, exact: true },
  { href: "/repos", label: "Repos", icon: GitBranch },
  { href: "/work", label: "Work", icon: FolderKanban },
  { href: "/hermes", label: "Hermes", icon: MessageSquare },
  {
    href: "/agents",
    label: "Agents",
    icon: Bot,
    requires: "canDelegate",
  },
  {
    href: "/integrations",
    label: "Connect",
    icon: Plug,
    requires: "canAccessIntegrations",
  },
  { href: "/team", label: "Team & Access", icon: UserCog },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", compact && "gap-2")}>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-teal to-teal-bright",
          compact ? "h-7 w-7" : "h-8 w-8",
        )}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn("text-foam", compact ? "h-4 w-4" : "h-4.5 w-4.5")}
        >
          <path
            d="M12 3C8 3 5 6 5 10c0 2.5 1.2 4.7 3 6.2V19a2 2 0 002 2h4a2 2 0 002-2v-2.8c1.8-1.5 3-3.7 3-6.2 0-4-3-7-7-7z"
            fill="currentColor"
            opacity="0.9"
          />
          <circle cx="9" cy="10" r="1" fill="var(--ink)" />
          <circle cx="15" cy="10" r="1" fill="var(--ink)" />
        </svg>
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "font-display font-bold leading-none text-foam",
            compact ? "text-sm" : "text-base",
          )}
        >
          KrakenLab
        </p>
        {!compact && (
          <p className="text-[0.65rem] uppercase tracking-[0.15em] text-mist">
            Harness
          </p>
        )}
      </div>
    </div>
  );
}

function NavLinks({
  orientation,
  session,
}: {
  orientation: "vertical" | "horizontal";
  session: SessionInfo;
}) {
  const pathname = usePathname();
  const navItems = baseNavItems.filter(
    (item) => !item.requires || session[item.requires],
  );

  return (
    <nav
      className={cn(
        orientation === "vertical"
          ? "flex flex-col gap-0.5"
          : "flex gap-1 overflow-x-auto pb-1 scrollbar-none",
      )}
      aria-label="Main navigation"
    >
      {navItems.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(pathname, href, exact);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "nav-link shrink-0",
              active && "nav-link-active",
              orientation === "horizontal" && "text-xs px-3 py-2",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const [session, setSession] = useState<SessionInfo>({
    canDelegate: true,
    canAccessIntegrations: true,
  });

  useEffect(() => {
    fetch("/api/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setSession({
            canDelegate: data.canDelegate ?? false,
            canAccessIntegrations: data.canAccessIntegrations ?? false,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <aside className="hidden md:flex md:w-56 lg:w-60 shrink-0 flex-col border-r border-[rgba(122,154,171,0.12)] bg-ocean-subtle">
        <div className="flex h-16 items-center border-b border-[rgba(122,154,171,0.12)] px-4">
          <BrandMark />
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <NavLinks orientation="vertical" session={session} />
          <div className="pt-2 border-t border-[rgba(122,154,171,0.12)]">
            <p className="text-[10px] uppercase tracking-wide text-mist mb-2 px-2">
              Repo filter
            </p>
            <Suspense fallback={null}>
              <RepoSelector className="w-full" />
            </Suspense>
          </div>
        </div>
        <div className="border-t border-[rgba(122,154,171,0.12)] p-4 space-y-2">
          <Link
            href="/login"
            className="text-xs text-teal-bright hover:underline"
          >
            Sign in
          </Link>
          <p className="text-[0.65rem] text-mist/70">KrakenLab Media Co.</p>
        </div>
      </aside>

      <header className="md:hidden border-b border-[rgba(122,154,171,0.12)] bg-ocean-subtle">
        <div className="flex h-14 items-center px-4">
          <BrandMark compact />
        </div>
        <div className="px-3 pb-2">
          <NavLinks orientation="horizontal" session={session} />
        </div>
      </header>
    </>
  );
}
