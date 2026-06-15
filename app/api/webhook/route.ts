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

function getSecretFromHeaders(request: Request): string | null {
  return (
    request.headers.get("x-secret-key") ||
    request.headers.get("x-webhook-secret") ||
    request.headers.get("x-bictorys-secret")
  );
}

export async function POST(request: Request) {
  try {
    const expectedSecret = getWebhookSecret();
    if (expectedSecret) {
      const receivedSecret = getSecretFromHeaders(request);
      if (receivedSecret !== expectedSecret) {
        return NextResponse.json({ error: "Webhook non autorisé" }, { status: 401 });
      }
    }

    const payload = await request.json();
    if (!isBictorysSuccessEvent(payload)) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const reference = getBictorysReference(payload);
    if (!reference) {
      return NextResponse.json({ error: "Référence manquante" }, { status: 400 });
    }

    const order = await getOrderByPaymentReference(reference);
    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    const paid = await processPayment(order.slug, order.paymentMethod || "bictorys");
    return NextResponse.json({ received: true, paid: !!paid });
  } catch {
    return NextResponse.json({ error: "Erreur webhook" }, { status: 500 });
  }
}
