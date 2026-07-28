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
          "flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--canvas)]",
          compact ? "h-7 w-7" : "h-8 w-8",
        )}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn("text-foam", compact ? "h-3.5 w-3.5" : "h-4 w-4")}
        >
          <path
            d="M12 2L4 7v10l8 5 8-5V7l-8-5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "font-display font-semibold leading-none text-foam tracking-tight",
            compact ? "text-sm" : "text-[0.9375rem]",
          )}
        >
          KrakenLab
        </p>
        {!compact && (
          <p className="text-[0.6875rem] text-mist mt-0.5">Company OS</p>
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
            <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
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
      <aside className="hidden md:flex md:w-56 lg:w-52 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--canvas)]">
        <div className="flex h-14 items-center px-4">
          <BrandMark />
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          <NavLinks orientation="vertical" session={session} />
          <div className="pt-3 border-t border-[var(--border-subtle)] px-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-mist mb-2 px-2">
              Filter
            </p>
            <Suspense fallback={null}>
              <RepoSelector className="w-full" />
            </Suspense>
          </div>
        </div>
        <div className="border-t border-[var(--border-subtle)] px-4 py-3 space-y-1">
          <Link
            href="/login"
            className="text-xs text-mist hover:text-foam transition-colors"
          >
            Sign in
          </Link>
          <p className="text-[10px] text-sand">KrakenLab Media</p>
        </div>
      </aside>

      <header className="md:hidden border-b border-[var(--border)] bg-[var(--canvas)]">
        <div className="flex h-12 items-center px-4">
          <BrandMark compact />
        </div>
        <div className="px-2 pb-2">
          <NavLinks orientation="horizontal" session={session} />
        </div>
      </header>
    </>
  );
}
