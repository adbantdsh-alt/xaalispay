import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { updateDb } from "@/lib/db";
import {
  refundEscrowForOrder,
  releaseEscrowForOrder,
} from "@/lib/ledger";
import { getAdminDisputes } from "@/lib/admin-stats";

type Action = "refund" | "release";

/**
 * POST /api/admin/disputes/[id]/resolve
 * body: { action: "refund" | "release", note?: string }
 *
 * refund  → rembourser l'acheteur (status = "refunded")
 * release → libérer les fonds au vendeur (status = "released")
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({})) as { action?: Action; note?: string };
  const action = body.action;

  if (action !== "refund" && action !== "release") {
    return NextResponse.json(
      { error: 'Action invalide. Utiliser "refund" ou "release".' },
      { status: 400 }
    );
  }

  let resolved = false;
  const now = new Date().toISOString();

  await updateDb((db) => {
    const order = db.orders.find((o) => o.id === id);
    if (!order || order.status !== "dispute") return;

    if (action === "refund") {
      order.status = "refunded";
      order.refundedAt = now;
      refundEscrowForOrder(db, order);
    } else {
      order.status = "released";
      order.releasedAt = now;
      releaseEscrowForOrder(db, order);
    }

    order.updatedAt = now;
    resolved = true;
  });

  if (!resolved) {
    return NextResponse.json(
      { error: "Commande introuvable ou non en litige." },
      { status: 404 }
    );
  }

  // Retourner la liste mise à jour
  const disputes = await getAdminDisputes();
  return NextResponse.json({ ok: true, disputes });
}
