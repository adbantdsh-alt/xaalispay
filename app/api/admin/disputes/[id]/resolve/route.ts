import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { getDb, updateDb } from "@/lib/db";
import { refundEscrowForOrder, releaseEscrowForOrder } from "@/lib/ledger";
import { getAdminDisputes } from "@/lib/admin-stats";
import { refundBictorysTransaction } from "@/lib/bictorys";

type Action = "refund" | "release";

/**
 * POST /api/admin/disputes/[id]/resolve
 * body: { action: "refund" | "release", force?: boolean }
 *
 * refund  → appelle Bictorys refund API puis met à jour le statut local
 * release → libère les fonds au vendeur (ledger local uniquement)
 *
 * Si force=true et action=refund : met à jour localement même si Bictorys échoue
 * (utile si le remboursement a été fait manuellement hors-bande)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request
    .json()
    .catch(() => ({})) as { action?: Action; force?: boolean };
  const action = body.action;
  const force = body.force === true;

  if (action !== "refund" && action !== "release") {
    return NextResponse.json(
      { error: 'Action invalide. Utiliser "refund" ou "release".' },
      { status: 400 }
    );
  }

  // 1. Récupérer la commande pour obtenir le paymentProviderId
  const db = await getDb();
  const order = db.orders.find((o) => o.id === id);

  if (!order || order.status !== "dispute") {
    return NextResponse.json(
      { error: "Commande introuvable ou non en litige." },
      { status: 404 }
    );
  }

  // 2. Pour un remboursement : appeler Bictorys en premier
  let bictorysError: string | null = null;

  if (action === "refund") {
    // Chercher l'ID transaction Bictorys dans l'ordre de priorité :
    // 1. paymentProviderId sur la commande (stocké à l'initiation ou via webhook)
    // 2. providerId du paymentAttempt réussi (mis à jour par le webhook)
    // 3. paymentReference (notre référence marchande — dernier recours)
    const successAttempt = db.paymentAttempts.find(
      (a) => a.orderId === order.id && (a.status === "success" || a.providerId)
    );
    const transactionId =
      order.paymentProviderId ||
      successAttempt?.providerId ||
      order.paymentReference ||
      null;

    if (!transactionId) {
      if (!force) {
        return NextResponse.json(
          {
            error:
              "Aucun identifiant de transaction Bictorys trouvé pour ce paiement. " +
              "Cliquez à nouveau pour confirmer le remboursement local (vérifiez d'abord le dashboard Bictorys).",
            canForce: true,
          },
          { status: 422 }
        );
      }
    } else {
      try {
        await refundBictorysTransaction(transactionId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur Bictorys inconnue";
        if (!force) {
          return NextResponse.json(
            {
              error: `Remboursement Bictorys échoué : ${msg}. Vérifiez le dashboard Bictorys puis confirmez ci-dessous.`,
              canForce: true,
              bictorysError: msg,
            },
            { status: 502 }
          );
        }
        bictorysError = msg;
      }
    }
  }

  // 3. Mettre à jour le statut local
  const now = new Date().toISOString();
  await updateDb((db) => {
    const o = db.orders.find((x) => x.id === id);
    if (!o) return;

    if (action === "refund") {
      o.status = "refunded";
      o.refundedAt = now;
      refundEscrowForOrder(db, o);
    } else {
      o.status = "released";
      o.releasedAt = now;
      releaseEscrowForOrder(db, o);
    }
    o.updatedAt = now;
  });

  const disputes = await getAdminDisputes();
  return NextResponse.json({
    ok: true,
    disputes,
    ...(bictorysError
      ? {
          warning:
            `Statut mis à jour localement, mais le remboursement Bictorys a échoué : ${bictorysError}. ` +
            "Vérifiez le tableau de bord Bictorys pour confirmer.",
        }
      : {}),
  });
}
