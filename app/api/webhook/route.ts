import { NextResponse } from "next/server";
import {
  getOrderByPaymentReference,
  processPayment,
} from "@/lib/orders";
import {
  getBictorysReference,
  getWebhookSecret,
  isBictorysSuccessEvent,
} from "@/lib/bictorys";
import { recordWebhookEvent } from "@/lib/ledger";
import { isWebhookSecretValid } from "@/lib/webhook-auth";

export async function POST(request: Request) {
  try {
    const auth = isWebhookSecretValid(request, getWebhookSecret());
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const payload = await request.json();
    if (!isBictorysSuccessEvent(payload)) {
      await recordWebhookEvent({
        provider: "bictorys",
        eventKey: String(
          (payload as { id?: unknown; eventId?: unknown; event_id?: unknown }).id ||
            (payload as { eventId?: unknown }).eventId ||
            (payload as { event_id?: unknown }).event_id ||
            JSON.stringify(payload)
        ),
        status: "ignored",
        payload,
      });
      return NextResponse.json({ received: true, ignored: true });
    }

    const reference = getBictorysReference(payload);
    if (!reference) {
      return NextResponse.json({ error: "Référence manquante" }, { status: 400 });
    }

    const eventKey = String(
      (payload as { id?: unknown; eventId?: unknown; event_id?: unknown }).id ||
        (payload as { eventId?: unknown }).eventId ||
        (payload as { event_id?: unknown }).event_id ||
        reference
    );

    const order = await getOrderByPaymentReference(reference);
    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    const event = await recordWebhookEvent({
      provider: "bictorys",
      eventKey,
      reference,
      status: "processed",
      payload,
    });
    if (event.duplicate) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const paid = await processPayment(order.slug, order.paymentMethod || "bictorys");
    return NextResponse.json({ received: true, paid: !!paid });
  } catch {
    return NextResponse.json({ error: "Erreur webhook" }, { status: 500 });
  }
}
