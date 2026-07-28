import type { ProviderName, StackCategory, StackDependency } from "@/lib/types";
import { store } from "@/lib/store/memory-store";
import { uid } from "@/lib/utils";

export interface ProviderMetadata {
  name: ProviderName;
  label: string;
  category: StackCategory;
  docsUrl: string;
  defaultBudgetUsd: number;
}

export const KNOWN_PROVIDERS: ProviderMetadata[] = [
  {
    name: "vercel",
    label: "Vercel",
    category: "hosting",
    docsUrl: "https://vercel.com/docs",
    defaultBudgetUsd: 200,
  },
  {
    name: "supabase",
    label: "Supabase",
    category: "database",
    docsUrl: "https://supabase.com/docs",
    defaultBudgetUsd: 75,
  },
  {
    name: "stripe",
    label: "Stripe",
    category: "payments",
    docsUrl: "https://stripe.com/docs",
    defaultBudgetUsd: 50,
  },
  {
    name: "openai",
    label: "OpenAI",
    category: "ai",
    docsUrl: "https://platform.openai.com/docs",
    defaultBudgetUsd: 100,
  },
  {
    name: "groq",
    label: "Groq",
    category: "ai",
    docsUrl: "https://console.groq.com/docs",
    defaultBudgetUsd: 80,
  },
  {
    name: "trigger",
    label: "trigger.dev",
    category: "background",
    docsUrl: "https://trigger.dev/docs",
    defaultBudgetUsd: 60,
  },
  {
    name: "resend",
    label: "Resend",
    category: "email",
    docsUrl: "https://resend.com/docs",
    defaultBudgetUsd: 30,
  },
  {
    name: "gcp",
    label: "Google Cloud",
    category: "infra",
    docsUrl: "https://cloud.google.com/docs",
    defaultBudgetUsd: 150,
  },
  {
    name: "redis",
    label: "Redis",
    category: "cache",
    docsUrl: "https://redis.io/docs",
    defaultBudgetUsd: 40,
  },
  {
    name: "openrouter",
    label: "OpenRouter",
    category: "ai",
    docsUrl: "https://openrouter.ai/docs",
    defaultBudgetUsd: 120,
  },
];

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface PackageRule {
  pattern: RegExp;
  name: string;
  category: StackCategory;
  critical?: boolean;
}

const PACKAGE_RULES: PackageRule[] = [
  { pattern: /^next$/, name: "next", category: "framework", critical: true },
  { pattern: /^react$/, name: "react", category: "framework", critical: true },
  {
    pattern: /^@supabase\//,
    name: "@supabase/*",
    category: "database",
    critical: true,
  },
  { pattern: /^stripe$/, name: "stripe", category: "payments", critical: true },
  { pattern: /^openai$/, name: "openai", category: "ai" },
  { pattern: /^@ai-sdk\//, name: "@ai-sdk/*", category: "ai", critical: true },
  { pattern: /^ai$/, name: "ai", category: "ai", critical: true },
  {
    pattern: /^@trigger\.dev\//,
    name: "@trigger.dev/*",
    category: "background",
  },
  { pattern: /^resend$/, name: "resend", category: "email" },
  {
    pattern: /^(ioredis|redis)$/,
    name: "redis",
    category: "cache",
    critical: true,
  },
  {
    pattern: /^@google-cloud\//,
    name: "@google-cloud/*",
    category: "infra",
  },
  { pattern: /^@vercel\//, name: "@vercel/*", category: "hosting" },
];

function cleanVersion(version: string): string {
  return version.replace(/^[\^~>=<]+/, "");
}

function detectStatus(name: string, version: string): StackDependency["status"] {
  const major = parseInt(cleanVersion(version).split(".")[0] ?? "0", 10);
  if (name === "next" && major < 15) return "outdated";
  if (name === "stripe" && major < 18) return "outdated";
  if (Number.isNaN(major)) return "unknown";
  return "healthy";
}

export function analyzePackageJson(pkgJson: PackageJson): StackDependency[] {
  const allDeps = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies,
  };

  const detected: StackDependency[] = [];
  const seen = new Set<string>();

  for (const [dep, version] of Object.entries(allDeps)) {
    for (const rule of PACKAGE_RULES) {
      if (!rule.pattern.test(dep)) continue;
      const key = `${rule.name}:${dep}`;
      if (seen.has(key)) continue;
      seen.add(key);

      detected.push({
        id: uid("stack"),
        name: dep,
        category: rule.category,
        version: cleanVersion(version),
        critical: rule.critical ?? false,
        status: detectStatus(dep, version),
      });
      break;
    }
  }

  return detected;
}

export function analyzeProjectStack(
  projectId?: string,
  pkgJson?: PackageJson,
): StackDependency[] {
  const fromStore = store.listStack(projectId);
  if (!pkgJson) return fromStore;

  const fromPkg = analyzePackageJson(pkgJson);
  const merged = new Map<string, StackDependency>();

  for (const item of fromStore) {
    merged.set(item.name, item);
  }
  for (const item of fromPkg) {
    const existing = merged.get(item.name);
    if (existing) {
      merged.set(item.name, {
        ...existing,
        version: item.version ?? existing.version,
        status: item.status,
      });
    } else {
      merged.set(item.name, { ...item, projectId });
    }
  }

  return Array.from(merged.values());
}

export interface CostRollup {
  totalBudgetUsd: number;
  totalSpendUsd: number;
  remainingUsd: number;
  utilizationPct: number;
  byProvider: Array<{
    provider: ProviderName;
    name: string;
    budgetUsd: number;
    spendUsd: number;
    utilizationPct: number;
  }>;
}

export function getCostRollup(): CostRollup {
  const costs = store.listCosts();
  const totalBudgetUsd = costs.reduce((s, c) => s + c.monthlyBudgetUsd, 0);
  const totalSpendUsd = costs.reduce((s, c) => s + c.actualSpendUsd, 0);
  const remainingUsd = totalBudgetUsd - totalSpendUsd;
  const utilizationPct =
    totalBudgetUsd > 0 ? (totalSpendUsd / totalBudgetUsd) * 100 : 0;

  return {
    totalBudgetUsd,
    totalSpendUsd,
    remainingUsd,
    utilizationPct,
    byProvider: costs.map((c) => ({
      provider: c.provider,
      name: c.name,
      budgetUsd: c.monthlyBudgetUsd,
      spendUsd: c.actualSpendUsd,
      utilizationPct:
        c.monthlyBudgetUsd > 0
          ? (c.actualSpendUsd / c.monthlyBudgetUsd) * 100
          : 0,
    })),
  };
}

export interface StackHealthScore {
  total: number;
  healthy: number;
  outdated: number;
  deprecated: number;
  unknown: number;
  healthPct: number;
}

export function scoreStackHealth(projectId?: string): StackHealthScore {
  const stack = store.listStack(projectId);
  const counts = { healthy: 0, outdated: 0, deprecated: 0, unknown: 0 };

  for (const item of stack) {
    counts[item.status]++;
  }

  const total = stack.length;
  const healthPct = total > 0 ? (counts.healthy / total) * 100 : 100;

  return { total, ...counts, healthPct };
}
