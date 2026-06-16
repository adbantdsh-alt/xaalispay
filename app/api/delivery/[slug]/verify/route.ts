import { NextResponse } from "next/server";
import { getOrderBySlug, processPayment, processOrderMaintenance } from "@/lib/orders";
import { toDeliverySession } from "@/lib/delivery-validation";
import { getProtectionDurationMinutes } from "@/lib/protection";
import { getDb } from "@/lib/db";

/**
 * POST /api/delivery/[slug]/verify
 *
 * Appelé quand le client revient du paiement Wave/Orange Money avec ?payment=success
 * et que la commande est encore en `pending_payment` (webhook pas encore arrivé).
 *
 * Logique : si un paymentAttempt Bictorys existe pour cette commande, on peut
 * confirmer le paiement localement sans attendre le webhook (idempotent).
 * La déduplication du webhook empêchera un double crédit si le webhook arrive plus tard.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  await processOrderMaintenance();
  const order = await getOrderBySlug(slug);

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  // Si déjà payé, renvoyer simplement la session (idempotent)
  if (order.status !== "pending_payment") {
    return NextResponse.json({
      verified: true,
      already_paid: true,
      session: toDeliverySession(order),
      protectionMinutes: getProtectionDurationMinutes(),
    });
  }

  // Vérifier qu'un attempt Bictorys existe bien pour cette commande
  const db = await getDb();
  const attempt = db.paymentAttempts.find(
    (a) => a.orderSlug === slug && a.provider === "bictorys" && a.status !== "failed"
  );

  if (!attempt) {
    // Pas de tentative de paiement initiée → on ne peut pas confirmer
    return NextResponse.json(
      { error: "Aucune tentative de paiement trouvée pour cette commande." },
      { status: 422 }
    );
  }

  // Forcer la confirmation du paiement
  const paymentMethod = attempt.paymentMethod || order.paymentMethod || "bictorys";
  const paid = await processPayment(slug, paymentMethod);

  if (!paid) {
    // processPayment ne modifie pas si status !== pending_payment (déjà mis à jour en parallèle)
    const refreshed = await getOrderBySlug(slug);
    return NextResponse.json({
      verified: true,
      already_paid: true,
      session: refreshed ? toDeliverySession(refreshed) : null,
      protectionMinutes: getProtectionDurationMinutes(),
    });
  }

  return NextResponse.json({
    verified: true,
    session: toDeliverySession(paid),
    protectionMinutes: getProtectionDurationMinutes(),
  });
}
