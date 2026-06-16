import { computeProtectionEndsAt } from "./protection";
import { updateDb } from "./db";
import type { Order } from "./types";
import { toDeliverySession } from "./delivery-code";

export {
  DELIVERY_CODE_TTL_MINUTES,
  computeDeliveryCodeExpiresAt,
  issueDeliveryCodeTimestamps,
  toDeliverySession,
} from "./delivery-code";
export type { DeliverySession } from "./delivery-code";

/**
 * Confirmation acheteur — transaction atomique dans updateDb (Supabase app_state).
 * Vérifie PIN + statut paid, passe en protection (Séquestre Flash 30 min).
 */
export async function confirmClientDelivery(
  slug: string,
  pin: string
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  const cleanPin = pin.trim();
  if (!/^\d{4}$/.test(cleanPin)) {
    return { ok: false, error: "Code livraison invalide" };
  }

  let result: Order | null = null;

  await updateDb((db) => {
    const order = db.orders.find((o) => o.slug === slug);
    if (!order) return;

    if (order.status === "protection" || order.status === "released") {
      result = order;
      return;
    }

    if (order.status !== "paid") {
      return;
    }

    if (order.pin !== cleanPin) {
      return;
    }

    const now = new Date().toISOString();
    order.status = "protection";
    order.deliveryValidatedAt = now;
    order.clientDeliveryConfirmedAt = now;
    order.protectionEndsAt = computeProtectionEndsAt(new Date(now));
    order.updatedAt = now;
    result = order;
  });

  if (!result) {
    return { ok: false, error: "Confirmation impossible. Vérifiez le code ou l'état de la commande." };
  }

  return { ok: true, order: result };
}
