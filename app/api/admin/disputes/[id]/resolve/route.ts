import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { getDb, updateDb, invalidateDbCache } from "@/lib/db";
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
      null; // Ne pas utiliser paymentReference : c'est notre slug, pas un ID Bictorys

    console.log("[resolve] transactionId:", transactionId, "| paymentProviderId:", order.paymentProviderId, "| attemptProviderId:", successAttempt?.providerId);

    if (!transactionId) {
      if (!force) {
        return NextResponse.json(
          {
            error:
              `Aucun ID de transaction Bictorys trouvé (paymentProviderId: ${order.paymentProviderId ?? "vide"}, attemptProviderId: ${successAttempt?.providerId ?? "vide"}). ` +
              "Cette commande a peut-être été payée en mode test. Vérifiez le dashboard Bictorys.",
            canForce: true,
            diagnostic: {
              paymentProviderId: order.paymentProviderId ?? null,
              attemptProviderId: successAttempt?.providerId ?? null,
              paymentReference: order.paymentReference ?? null,
            },
          },
          { status: 422 }
        );
      }
    } else {
      try {
        const result = await refundBictorysTransaction(transactionId);
        console.log("[resolve] Bictorys refund OK:", JSON.stringify(result));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur Bictorys inconnue";
        console.error("[resolve] Bictorys refund FAILED:", msg, "| transactionId:", transactionId);
        if (!force) {
          const encodingIssue = /ByteString|greater than 255/i.test(msg);
          return NextResponse.json(
            {
              error: encodingIssue
                ? `Remboursement automatique bloqué (clé API mal formatée dans Vercel). ${msg}`
                : `Remboursement automatique échoué : ${msg}`,
              canForce: !encodingIssue,
              bictorysError: msg,
              diagnostic: { transactionId },
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

  // Invalider le cache mémoire et recharger depuis Supabase pour garantir
  // que la liste retournée reflète bien ce qui est persisté.
  invalidateDbCache();
  const disputes = await getAdminDisputes();
  return NextResponse.json(
    {
      ok: true,
      disputes,
      ...(bictorysError
        ? {
            warning:
              `Statut mis à jour localement, mais le remboursement Bictorys a échoué : ${bictorysError}. ` +
              "Vérifiez le tableau de bord Bictorys pour confirmer.",
          }
        : {}),
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
