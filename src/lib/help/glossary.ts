/** Plain-language explanations for non-technical harness users. */

export interface GlossaryEntry {
  term: string;
  short: string;
  detail: string;
  learnMore?: string;
}

export const GLOSSARY = {
  github: {
    term: "GitHub",
    short: "Where your team stores code and tracks changes.",
    detail:
      "GitHub is the source of truth for each product’s codebase. The harness reads activity from GitHub — it does not replace GitHub.",
    learnMore: "https://docs.github.com/en/get-started",
  },
  repository: {
    term: "Repository",
    short: "One product or codebase on GitHub.",
    detail:
      "Each repo usually maps to one app or service (for example krakenlab/harness). Open a repo here to see recent activity and health.",
  },
  pullRequest: {
    term: "Pull Request (PR)",
    short: "A proposed change waiting for review before it goes live.",
    detail:
      "Someone finished a piece of work and opened a PR so others can review it. When approved, it gets merged into the main line of code. Think of it as a formal change request with a discussion thread.",
    learnMore: "https://docs.github.com/en/pull-requests",
  },
  commit: {
    term: "Commit",
    short: "A saved snapshot of code with a short description.",
    detail:
      "Each commit is one step of work — like saving a draft with a note about what changed. Many commits often roll up into one pull request.",
  },
  merge: {
    term: "Merged",
    short: "The change was approved and is now part of the main codebase.",
    detail:
      "Merging closes the pull request and applies the work to the default branch (usually main). This is the step before deployment pipelines run.",
  },
  githubActions: {
    term: "Automated checks",
    short: "GitHub Actions — robots that test the code after each change.",
    detail:
      "When code is pushed or a PR is updated, automated workflows run tests and linting. Green means checks passed; red means something failed and usually needs a developer.",
    learnMore: "https://docs.github.com/en/actions",
  },
  stackScan: {
    term: "Technology stack",
    short: "The main libraries and tools this repo uses.",
    detail:
      "We read package.json from GitHub to list dependencies (like Next.js or Stripe). “Outdated” or “critical” flags help developers prioritize upgrades — you can ignore the version numbers unless something is marked critical.",
  },
  demoTimeline: {
    term: "Sample timeline",
    short: "Example activity shown until GitHub is connected.",
    detail:
      "An admin can connect GitHub with a token so this view shows real commits, PRs, and check results. Until then, sample data helps you explore the layout.",
  },
  hermes: {
    term: "Hermes",
    short: "Ask questions about projects, spend, tickets, and repos in plain language.",
    detail:
      "Hermes is the harness assistant. Try “Summarize open tickets” or “What happened on this repo lately?” — no Git commands required.",
  },
  branch: {
    term: "Branch",
    short: "A separate line of work, often tied to one feature or fix.",
    detail:
      "Developers work on branches so main stays stable. Pull requests merge a branch back into main when ready.",
  },
} as const satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof GLOSSARY;
