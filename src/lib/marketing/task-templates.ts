import type {
  MarketingTaskCategory,
  MarketingTaskPriority,
} from "@/lib/types";

export interface MarketingTaskTemplate {
  id: MarketingTaskCategory;
  title: string;
  hint: string;
  brief: string;
  defaultPriority: MarketingTaskPriority;
  labels: string[];
}

/** Plain-language presets for non-marketers requesting creative work. */
export const MARKETING_TASK_TEMPLATES: MarketingTaskTemplate[] = [
  {
    id: "landing_page",
    title: "Landing page refresh",
    hint: "Homepage or product page — layout, messaging, and calls to action.",
    brief:
      "Refresh the landing page so visitors immediately understand what we offer and what to do next. Include updated hero copy, clearer value proposition, and mobile-friendly layout.",
    defaultPriority: "high",
    labels: ["landing-page", "web"],
  },
  {
    id: "ui_redesign",
    title: "UI redesign",
    hint: "Improve look and feel of an app screen or dashboard section.",
    brief:
      "Redesign the selected UI so it feels modern, accessible, and on-brand. Focus on clarity for non-technical users — reduce clutter and improve hierarchy.",
    defaultPriority: "medium",
    labels: ["ui", "design"],
  },
  {
    id: "brand_copy",
    title: "Brand & copy update",
    hint: "Headlines, product descriptions, or tone-of-voice refresh.",
    brief:
      "Update brand copy to be clearer and more consistent across the product. Align tone with KrakenLab voice — confident, plain-language, mission-focused.",
    defaultPriority: "medium",
    labels: ["copy", "brand"],
  },
  {
    id: "social_campaign",
    title: "Social campaign",
    hint: "Launch or refresh content for LinkedIn, X, or other channels.",
    brief:
      "Plan and draft a short social campaign (posts + creative direction) promoting our latest release or milestone. Include suggested posting schedule.",
    defaultPriority: "medium",
    labels: ["social", "campaign"],
  },
  {
    id: "email_campaign",
    title: "Email campaign",
    hint: "Newsletter, announcement, or lifecycle email sequence.",
    brief:
      "Draft an email campaign with subject lines, body copy, and CTA. Target existing users or prospects; keep messaging concise and scannable.",
    defaultPriority: "medium",
    labels: ["email", "campaign"],
  },
  {
    id: "other",
    title: "Other marketing request",
    hint: "Anything creative — events, one-pagers, pitch decks, etc.",
    brief: "",
    defaultPriority: "low",
    labels: ["marketing"],
  },
];

export const MARKETING_CATEGORY_LABELS: Record<MarketingTaskCategory, string> = {
  landing_page: "Landing page",
  ui_redesign: "UI redesign",
  brand_copy: "Brand & copy",
  social_campaign: "Social campaign",
  email_campaign: "Email campaign",
  other: "Other",
};

export function getMarketingTemplate(
  category: MarketingTaskCategory,
): MarketingTaskTemplate {
  return (
    MARKETING_TASK_TEMPLATES.find((t) => t.id === category) ??
    MARKETING_TASK_TEMPLATES[MARKETING_TASK_TEMPLATES.length - 1]!
  );
}

export function buildMarketingTaskDraft(options: {
  category: MarketingTaskCategory;
  title?: string;
  brief?: string;
  projectId?: string;
  targetUrl?: string;
  requesterName?: string;
  extraNotes?: string;
}): { title: string; brief: string; labels: string[]; priority: MarketingTaskPriority } {
  const template = getMarketingTemplate(options.category);
  const title =
    options.title?.trim() ||
    template.title;
  const briefParts = [
    options.brief?.trim() || template.brief,
    options.targetUrl?.trim()
      ? `\n\nTarget URL or screen: ${options.targetUrl.trim()}`
      : null,
    options.projectId ? `\n\nRelated project ID: ${options.projectId}` : null,
    options.requesterName
      ? `\n\nRequested by: ${options.requesterName}`
      : null,
    options.extraNotes?.trim()
      ? `\n\nAdditional context:\n${options.extraNotes.trim()}`
      : null,
  ].filter(Boolean);

  return {
    title,
    brief: briefParts.join(""),
    labels: [...template.labels],
    priority: template.defaultPriority,
  };
}
