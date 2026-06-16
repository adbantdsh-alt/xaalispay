import { NextResponse } from "next/server";
import {
  getBictorysReference,
  getBictorysStatus,
  getBictorysTransactionId,
  getRefundWebhookSecret,
  isBictorysSuccessEvent,
  normalizeBictorysStatus,
} from "@/lib/bictorys";
import { recordWebhookEvent } from "@/lib/ledger";
import { markOrderRefundedByReference } from "@/lib/orders";
import {
  parseBictorysWebhookPayload,
  verifyBictorysWebhookSignature,
  webhookResponse,
} from "@/lib/bictorys-webhook";

function isRefundSuccess(status?: string, payload?: unknown) {
  if (payload && isBictorysSuccessEvent(payload)) return true;
  const clean = normalizeBictorysStatus(status);
  return (
    clean.includes("success") ||
    clean.includes("succeeded") ||
    clean.includes("complete") ||
    clean.includes("refund") ||
    clean === "reversed"
  );
}

export async function GET() {
  return NextResponse.json({ ok: true, webhook: "refund" });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  let payload: unknown = {};

  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return webhookResponse({ received: true, parse_error: true });
  }

  const auth = verifyBictorysWebhookSignature(request, rawBody, getRefundWebhookSecret());
  if (!auth.ok) {
    console.error("[webhook refund] auth échouée:", auth.reason);
    return webhookResponse({ received: true, unauthorized: true });
  }

  try {
    const parsed = parseBictorysWebhookPayload(payload, "refund");
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

    const refundReference =
      parsed.reference || getBictorysReference(payload) || getBictorysTransactionId(payload);
    const order =
      refundReference && isRefundSuccess(status, payload)
        ? await markOrderRefundedByReference(refundReference)
        : null;

    return webhookResponse({ received: true, order: order?.slug || null });
  } catch (err) {
    console.error("[webhook refund] erreur:", err);
    return webhookResponse({ received: true, error: true });
  }
}
