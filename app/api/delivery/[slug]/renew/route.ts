import { NextResponse } from "next/server";
import { getOrderBySlug } from "@/lib/orders";
import { toDeliverySession, issueDeliveryCodeTimestamps } from "@/lib/delivery-validation";
import { updateDb } from "@/lib/db";
import { collectUsedPins, generateUniquePin } from "@/lib/utils";

/**
 * POST /api/delivery/[slug]/renew
 * Renouvelle le code livraison (PIN + TTL 15 min) quand le précédent a expiré.
 * Disponible seulement si statut = "paid".
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const order = await getOrderBySlug(slug);
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (order.status !== "paid") {
    return NextResponse.json(
      { error: "Renouvellement disponible uniquement pour une commande en attente de validation." },
      { status: 422 }
    );
  }

  let updated = order;

  await updateDb((db) => {
    const o = db.orders.find((x) => x.slug === slug);
    if (!o || o.status !== "paid") return;
    const usedPins = collectUsedPins(db);
    usedPins.delete(o.pin); // allow reuse only if truly needed
    o.pin = generateUniquePin(usedPins);
    const ts = issueDeliveryCodeTimestamps(new Date());
    o.deliveryCodeIssuedAt = ts.deliveryCodeIssuedAt;
    o.deliveryCodeExpiresAt = ts.deliveryCodeExpiresAt;
    o.updatedAt = new Date().toISOString();
    updated = { ...o };
  });

  return NextResponse.json({ session: toDeliverySession(updated) });
}
