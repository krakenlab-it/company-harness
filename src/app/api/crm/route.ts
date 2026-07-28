import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import type { CrmContactStatus, CrmDealStage } from "@/lib/types";

function mapDealStage(stage?: string): CrmDealStage {
  const map: Record<string, CrmDealStage> = {
    lead: "discovery",
    qualified: "discovery",
    discovery: "discovery",
    proposal: "proposal",
    negotiation: "negotiation",
    won: "won",
    lost: "lost",
  };
  return map[stage ?? "discovery"] ?? "discovery";
}

function buildHermesInsight() {
  const contacts = store.listContacts();
  const deals = store.listDeals();
  const activeDeals = deals.filter(
    (d) => d.stage !== "won" && d.stage !== "lost",
  );
  const pipelineValue = activeDeals.reduce((sum, d) => sum + d.valueUsd, 0);

  return {
    summary: `${contacts.length} contacts and ${activeDeals.length} active deals in pipeline (${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(pipelineValue)} total value).`,
    recommendations: [
      "Follow up on deals in negotiation stage this week.",
      "Review churned contacts for re-engagement opportunities.",
      "Ask Hermes for deal-specific talking points before client calls.",
    ],
    updatedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    await requireAuth();
    const contacts = store.listContacts();
    const deals = store.listDeals().map((deal) => {
      const contact = store.getContact(deal.contactId);
      return {
        ...deal,
        value: deal.valueUsd,
        contactName: contact?.name,
      };
    });

    const insight = buildHermesInsight();

    return NextResponse.json({
      contacts,
      deals,
      hermesInsight: insight,
      insight,
    });
  } catch {
    return jsonError("Failed to load CRM data");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await parseJsonBody<Record<string, unknown>>(request);
    if (!body) {
      return jsonError("Invalid JSON body", 400);
    }

    const kind = (body.kind ?? body.type) as string | undefined;

    if (kind === "contact") {
      if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
        return jsonError("name is required for contact", 400);
      }

      const contact = store.createContact({
        name: body.name.trim(),
        email: typeof body.email === "string" ? body.email : undefined,
        company: typeof body.company === "string" ? body.company : undefined,
        status: (body.status as CrmContactStatus) ?? "lead",
        ownerId: typeof body.ownerId === "string" ? body.ownerId : undefined,
        notes:
          typeof body.role === "string"
            ? `Role: ${body.role}`
            : typeof body.notes === "string"
              ? body.notes
              : undefined,
      });

      store.addActivity({
        entityType: "contact",
        entityId: contact.id,
        action: "created",
        summary: `Added CRM contact: ${contact.name}`,
      });

      return NextResponse.json({ contact }, { status: 201 });
    }

    if (kind === "deal") {
      if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
        return jsonError("title is required for deal", 400);
      }

      const contactId =
        typeof body.contactId === "string" ? body.contactId : undefined;
      if (!contactId) {
        const firstContact = store.listContacts()[0];
        if (!firstContact) {
          return jsonError("contactId is required — add a contact first", 400);
        }
      }

      const deal = store.createDeal({
        contactId:
          contactId ?? store.listContacts()[0]!.id,
        title: body.title.trim(),
        valueUsd:
          typeof body.value === "number"
            ? body.value
            : typeof body.valueUsd === "number"
              ? body.valueUsd
              : 0,
        stage: mapDealStage(
          typeof body.stage === "string" ? body.stage : undefined,
        ),
        probability:
          typeof body.probability === "number" ? body.probability : 50,
        expectedClose:
          typeof body.expectedClose === "string"
            ? body.expectedClose
            : undefined,
      });

      store.addActivity({
        entityType: "deal",
        entityId: deal.id,
        action: "created",
        summary: `Added CRM deal: ${deal.title}`,
      });

      return NextResponse.json(
        {
          deal: {
            ...deal,
            value: deal.valueUsd,
            stage:
              typeof body.stage === "string" ? body.stage : deal.stage,
          },
        },
        { status: 201 },
      );
    }

    return jsonError("kind must be 'contact' or 'deal'", 400);
  } catch {
    return jsonError("Failed to create CRM record");
  }
}
