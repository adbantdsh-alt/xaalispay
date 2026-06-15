import { NextResponse } from "next/server";
import {
  getBictorysReference,
  getBictorysStatus,
  getBictorysTransactionId,
  getPayoutWebhookSecret,
} from "@/lib/bictorys";
import { recordWebhookEvent } from "@/lib/ledger";
import { updatePayoutFromProvider } from "@/lib/payouts";

function getSecretFromHeaders(request: Request): string | null {
  return (
    request.headers.get("x-secret-key") ||
    request.headers.get("x-webhook-secret") ||
    request.headers.get("x-bictorys-secret")
  );
}

export async function GET() {
  return NextResponse.json({ ok: true, webhook: "payout" });
}

export async function POST(request: Request) {
  try {
    const expectedSecret = getPayoutWebhookSecret();
    if (expectedSecret && getSecretFromHeaders(request) !== expectedSecret) {
      return NextResponse.json({ error: "Webhook payout non autorisé" }, { status: 401 });
    }

    const payload = await request.json();
    const reference = getBictorysReference(payload);
    const providerId = getBictorysTransactionId(payload);
    const status = getBictorysStatus(payload);
    const eventKey = `payout:${providerId || reference || JSON.stringify(payload)}`;

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

    const payout = await updatePayoutFromProvider({
      reference,
      providerId,
      status,
    });

    return NextResponse.json({ received: true, payout: payout?.id || null });
  } catch {
    return NextResponse.json({ error: "Erreur webhook payout" }, { status: 500 });
  }
}
