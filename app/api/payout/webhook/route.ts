import { NextResponse } from "next/server";
import {
  getBictorysReference,
  getBictorysStatus,
  getBictorysTransactionId,
  getPayoutWebhookSecret,
  normalizeBictorysStatus,
} from "@/lib/bictorys";
import { recordWebhookEvent } from "@/lib/ledger";
import { updatePayoutFromProvider } from "@/lib/payouts";
import {
  parseBictorysWebhookPayload,
  verifyBictorysWebhookSignature,
  webhookResponse,
} from "@/lib/bictorys-webhook";

export async function GET() {
  return NextResponse.json({ ok: true, webhook: "payout" });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  let payload: unknown = {};

  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return webhookResponse({ received: true, parse_error: true });
  }

  const secret = getPayoutWebhookSecret();
  const auth = verifyBictorysWebhookSignature(request, rawBody, secret);
  if (!auth.ok) {
    console.error("[webhook payout] auth échouée:", auth.reason);
    return webhookResponse({ received: true, unauthorized: true });
  }

  try {
    const parsed = parseBictorysWebhookPayload(payload, "payout");
    const status = normalizeBictorysStatus(parsed.status ?? getBictorysStatus(payload));

    const event = await recordWebhookEvent({
      provider: "bictorys",
      eventKey: parsed.eventKey,
      reference: parsed.reference || parsed.providerId,
      status: parsed.failure ? "failed" : "processed",
      payload,
    });
    if (event.duplicate) {
      return webhookResponse({ received: true, duplicate: true });
    }

    const payout = await updatePayoutFromProvider({
      reference: parsed.reference || getBictorysReference(payload),
      providerId: parsed.providerId || getBictorysTransactionId(payload),
      status,
    });

    return webhookResponse({ received: true, payout: payout?.id || null });
  } catch (err) {
    console.error("[webhook payout] erreur:", err);
    return webhookResponse({ received: true, error: true });
  }
}
