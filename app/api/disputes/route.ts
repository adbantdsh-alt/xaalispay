import { NextResponse } from "next/server";
import {
  getDisputableOrderByPin,
  getProfileById,
  openDisputeByPin,
} from "@/lib/orders";
import { getOrderTotal } from "@/lib/utils";
import type { Order } from "@/lib/types";

function serializeOrder(order: Order, sellerName = "Vendeur") {
  return {
    id: order.id,
    productName: order.productName,
    sellerName,
    clientName: order.clientName,
    amount: getOrderTotal(order),
    status: order.status,
    paidAt: order.paidAt,
    deliveryValidatedAt: order.deliveryValidatedAt,
    disputeOpenedAt: order.disputeOpenedAt,
  };
}

function isValidPhotoDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(value) &&
    value.length <= 1_500_000
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body?.action;
    const pin = String(body?.pin || "").trim();

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "Entrez le code livraison à 4 chiffres." },
        { status: 400 }
      );
    }

    const order = await getDisputableOrderByPin(pin);
    if (!order) {
      return NextResponse.json(
        { error: "Aucune commande active trouvée avec ce code." },
        { status: 404 }
      );
    }

    const seller = await getProfileById(order.sellerId);

    if (action === "lookup") {
      return NextResponse.json({
        order: serializeOrder(order, seller?.businessName || seller?.displayName),
      });
    }

    if (action === "submit") {
      const reason = String(body?.reason || "").trim();
      const photos = Array.isArray(body?.photos) ? body.photos : [];

      if (order.status === "dispute") {
        return NextResponse.json({
          order: serializeOrder(order, seller?.businessName || seller?.displayName),
          alreadyOpen: true,
        });
      }

      if (reason.length < 12) {
        return NextResponse.json(
          { error: "Expliquez le problème en quelques mots." },
          { status: 400 }
        );
      }

      if (photos.length < 2 || photos.length > 10 || !photos.every(isValidPhotoDataUrl)) {
        return NextResponse.json(
          { error: "Ajoutez entre 2 et 10 photos valides (PNG, JPG ou WebP)." },
          { status: 400 }
        );
      }

      const disputed = await openDisputeByPin(pin, { reason, photos });
      if (!disputed) {
        return NextResponse.json(
          { error: "Impossible d'ouvrir le litige pour cette commande." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        order: serializeOrder(disputed, seller?.businessName || seller?.displayName),
      });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
