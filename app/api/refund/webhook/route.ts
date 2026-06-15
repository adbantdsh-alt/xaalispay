import { NextResponse } from "next/server";
import {
  getBictorysReference,
  getBictorysStatus,
  getBictorysTransactionId,
  getRefundWebhookSecret,
} from "@/lib/bictorys";
import { recordWebhookEvent } from "@/lib/ledger";
import { markOrderRefundedByReference } from "@/lib/orders";

function getSecretFromHeaders(request: Request): string | null {
  return (
    request.headers.get("x-secret-key") ||
    request.headers.get("x-webhook-secret") ||
    request.headers.get("x-bictorys-secret")
  );
}

function isRefundSuccess(status?: string) {
  const clean = (status || "").toLowerCase();
  return clean.includes("success") || clean.includes("complete") || clean.includes("refund");
}

export async function GET() {
  return NextResponse.json({ ok: true, webhook: "refund" });
}

export async function POST(request: Request) {
  try {
    const expectedSecret = getRefundWebhookSecret();
    if (expectedSecret && getSecretFromHeaders(request) !== expectedSecret) {
      return NextResponse.json({ error: "Webhook refund non autorisé" }, { status: 401 });
    }

    const payload = await request.json();
    const reference = getBictorysReference(payload);
    const providerId = getBictorysTransactionId(payload);
    const status = getBictorysStatus(payload);
    const eventKey = `refund:${providerId || reference || JSON.stringify(payload)}`;

    const event = await recordWebhookEvent({
      provider: "bictorys",
      eventKey,
      reference: reference || providerId,
      status: "processed",
      payload,
    });
    if (event.duplicate) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const refundReference = reference || providerId;
    const order =
      refundReference && isRefundSuccess(status)
        ? await markOrderRefundedByReference(refundReference)
        : null;

    return NextResponse.json({ received: true, order: order?.slug || null });
  } catch {
    return NextResponse.json({ error: "Erreur webhook refund" }, { status: 500 });
  }
}
