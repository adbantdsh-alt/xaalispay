import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getDb, updateDb } from "@/lib/db";
import { refundEscrowForOrder } from "@/lib/ledger";
import { refundBictorysTransaction } from "@/lib/bictorys";

const CANCELLABLE_STATUSES = ["pending_payment", "paid"] as const;

/**
 * POST /api/orders/cancel
 * body: { orderId, reason? }
 * Le vendeur annule une commande qu'il ne peut pas honorer.
 * - pending_payment : annulation simple, aucun remboursement (jamais payé)
 * - paid : déclenche le remboursement Bictorys + mise à jour locale
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as {
    orderId?: string;
    reason?: string;
  };
  const { orderId, reason } = body;

  if (!orderId) {
    return NextResponse.json({ error: "orderId requis" }, { status: 400 });
  }

  const db = await getDb();
  const order = db.orders.find((o) => o.id === orderId && o.sellerId === user.id);

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (!CANCELLABLE_STATUSES.includes(order.status as typeof CANCELLABLE_STATUSES[number])) {
    return NextResponse.json(
      {
        error: `Cette commande ne peut pas être annulée (statut actuel : ${order.status}). Seules les commandes en attente ou payées peuvent être annulées.`,
      },
      { status: 422 }
    );
  }

  let bictorysWarning: string | null = null;

  // Si la commande est déjà payée → tenter le remboursement Bictorys
  if (order.status === "paid") {
    const successAttempt = db.paymentAttempts.find(
      (a) => a.orderId === order.id && (a.status === "success" || a.providerId)
    );
    const transactionId = order.paymentProviderId || successAttempt?.providerId || null;

    if (transactionId) {
      try {
        await refundBictorysTransaction(transactionId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur Bictorys";
        // On continue l'annulation locale mais on avertit
        bictorysWarning = `Remboursement Bictorys non confirmé : ${msg}. Vérifiez le dashboard Bictorys et remboursez manuellement si nécessaire.`;
      }
    } else {
      bictorysWarning =
        "Aucun identifiant de transaction trouvé — remboursement Bictorys non déclenché. Remboursez le client manuellement via le dashboard Bictorys.";
    }
  }

  // Mise à jour locale
  const now = new Date().toISOString();
  await updateDb((db) => {
    const o = db.orders.find((x) => x.id === orderId);
    if (!o) return;
    if (o.status === "paid") {
      refundEscrowForOrder(db, o);
    }
    o.status = "cancelled";
    o.cancelledAt = now;
    o.cancellationReason = (reason || "").trim() || "Annulé par le vendeur";
    o.updatedAt = now;
  });

  return NextResponse.json({
    ok: true,
    ...(bictorysWarning ? { warning: bictorysWarning } : {}),
  });
}
