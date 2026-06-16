import {
  getOrderByPaymentReference,
  processPayment,
} from "@/lib/orders";
import {
  getWebhookSecret,
} from "@/lib/bictorys";
import { recordWebhookEvent } from "@/lib/ledger";
import {
  parseBictorysWebhookPayload,
  verifyBictorysWebhookSignature,
  verifyOrderWebhookAmount,
  webhookResponse,
} from "@/lib/bictorys-webhook";

export async function POST(request: Request) {
  const rawBody = await request.text();
  let payload: unknown = {};

  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    console.error("[webhook payin] JSON invalide");
    return webhookResponse({ received: true, parse_error: true });
  }

  const auth = verifyBictorysWebhookSignature(request, rawBody, getWebhookSecret());
  if (!auth.ok) {
    console.error("[webhook payin] auth échouée:", auth.reason);
    return webhookResponse({ received: true, unauthorized: true });
  }

  try {
    const parsed = parseBictorysWebhookPayload(payload, "payin");

    if (!parsed.success) {
      await recordWebhookEvent({
        provider: "bictorys",
        eventKey: parsed.eventKey,
        reference: parsed.reference || undefined,
        status: parsed.failure ? "failed" : "ignored",
        payload,
      });
      return webhookResponse({ received: true, ignored: true, status: parsed.status });
    }

    if (!parsed.reference) {
      console.error("[webhook payin] référence manquante");
      return webhookResponse({ received: true, missing_reference: true });
    }

    const order = await getOrderByPaymentReference(parsed.reference);
    if (!order) {
      console.error("[webhook payin] commande introuvable:", parsed.reference);
      return webhookResponse({ received: true, order_not_found: true });
    }

    if (!verifyOrderWebhookAmount(order, parsed.amount)) {
      console.error("[webhook payin] montant invalide", {
        reference: parsed.reference,
        webhookAmount: parsed.amount,
      });
      await recordWebhookEvent({
        provider: "bictorys",
        eventKey: `${parsed.eventKey}:amount_mismatch`,
        reference: parsed.reference,
        status: "failed",
        payload,
      });
      return webhookResponse({ received: true, amount_mismatch: true });
    }

    const event = await recordWebhookEvent({
      provider: "bictorys",
      eventKey: parsed.eventKey,
      reference: parsed.reference,
      status: "processed",
      payload,
    });
    if (event.duplicate) {
      return webhookResponse({ received: true, duplicate: true });
    }

    const paid = await processPayment(order.slug, order.paymentMethod || "bictorys");
    return webhookResponse({ received: true, paid: !!paid });
  } catch (err) {
    console.error("[webhook payin] erreur interne:", err);
    return webhookResponse({ received: true, error: true });
  }
}
