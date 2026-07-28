export interface StackGuidelineSection {
  id: string;
  title: string;
  summary: string;
  items: string[];
}

export interface PreferredStackGuidelines {
  version: string;
  updatedAt: string;
  sections: StackGuidelineSection[];
  markdown: string;
}

export const PREFERRED_STACK_SECTIONS: StackGuidelineSection[] = [
  {
    id: "framework",
    title: "Application Framework",
    summary: "Next.js is the default for all new KrakenLab Media products.",
    items: [
      "Use Next.js App Router with React Server Components where practical.",
      "TypeScript is required for all production code.",
      "Tailwind CSS for styling; shadcn/ui for shared components.",
    ],
  },
  {
    id: "database",
    title: "Database & Auth",
    summary: "Supabase is the preferred database and auth layer.",
    items: [
      "PostgreSQL via Supabase for primary data storage.",
      "Row Level Security enabled on all user-facing tables.",
      "Use Redis (Upstash or GCP Memorystore) for heavy read queries and caching.",
    ],
  },
  {
    id: "ai",
    title: "AI & LLM",
    summary: "Choose the right model tier for the job.",
    items: [
      "Hermes (Groq) powers the company harness assistant.",
      "Gemini for general-purpose AI features and multimodal workloads.",
      "OpenRouter + AI SDK for AI-heavy apps that need model flexibility.",
      "Always log token usage and route through approved providers.",
    ],
  },
  {
    id: "infra",
    title: "Cloud & Infrastructure",
    summary: "GCP for cloud services, Terraform for IaC, Vercel for hosting.",
    items: [
      "Vercel for Next.js hosting and preview deployments.",
      "GCP for cloud storage, compute, and managed services.",
      "Terraform modules for reproducible infrastructure.",
      "trigger.dev for background jobs and long-running agents.",
    ],
  },
  {
    id: "integrations",
    title: "Payments, Email & Background",
    summary: "Standard integrations for revenue and communications.",
    items: [
      "Stripe for payments and subscriptions.",
      "Resend for transactional email.",
      "trigger.dev for scheduled tasks, webhooks, and agent workflows.",
    ],
  },
  {
    id: "testing",
    title: "Testing & Quality",
    summary: "Ship with confidence through automated checks.",
    items: [
      "Vitest for unit and integration tests.",
      "Playwright or Testing Library for critical user flows.",
      "Lint and type-check must pass before merge.",
      "Preview deployments required for feature PRs.",
    ],
  },
  {
    id: "harness",
    title: "Company Harness",
    summary: "Hermes is the operational core of KrakenLab Media.",
    items: [
      "Track projects, sprints, and tickets in the harness.",
      "Monitor provider costs and team budgets weekly.",
      "Delegate coding tasks to Cursor agents via Hermes.",
      "CRM insights and stack health feed into Hermes context.",
    ],
  },
];

export const PREFERRED_STACK_MARKDOWN = `# KrakenLab Media — Preferred Stack Guidelines

## Overview
KrakenLab Media builds modern web products with a consistent, battle-tested stack. These guidelines help the team ship faster while keeping costs and complexity in check.

## Application Framework
- **Next.js** (App Router) is the default framework for all new projects.
- **TypeScript** is required; no plain JavaScript in production.
- **Tailwind CSS** + **shadcn/ui** for UI consistency.

## Database & Auth
- **Supabase** (PostgreSQL) for primary data, auth, and realtime.
- Enable **RLS** on every user-facing table.
- **Redis** for heavy database queries, session caches, and rate limiting.

## AI & LLM
- **Hermes** (Groq-powered) is the company harness AI — projects, tickets, CRM, costs.
- **Gemini** for general AI features and multimodal use cases.
- **OpenRouter + AI SDK** when an app needs multiple models or provider failover.
- Log all AI usage; stay within team budget alerts.

## Cloud & Infrastructure
- **Vercel** for Next.js hosting, previews, and edge functions.
- **GCP** for cloud storage, compute, and managed services beyond Vercel.
- **Terraform** for infrastructure as code — no manual console changes in prod.
- **trigger.dev** for background agents, cron jobs, and webhook processing.

## Payments, Email & Background
- **Stripe** for payments, subscriptions, and invoicing.
- **Resend** for transactional email.
- **trigger.dev** for async work that outlives a serverless function timeout.

## Testing Requirements
- Unit tests with **Vitest** for business logic.
- Component/integration tests for critical paths.
- CI must pass lint, type-check, and tests before merge.

## Company Harness
Hermes ties everything together: project status, sprint planning, CRM pipeline, provider spend, stack health, and Cursor agent delegation. When in doubt, ask Hermes.
`;

export const PREFERRED_STACK: PreferredStackGuidelines = {
  version: "1.0.0",
  updatedAt: "2026-01-15T00:00:00.000Z",
  sections: PREFERRED_STACK_SECTIONS,
  markdown: PREFERRED_STACK_MARKDOWN,
};
