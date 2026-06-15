import { NextResponse } from "next/server";
import {
  getDisputableOrderByPin,
  getProductById,
  getProfileById,
  openDisputeByPin,
} from "@/lib/orders";
import { getOrderTotal } from "@/lib/utils";
import type { DisputeMedia, Order, Product } from "@/lib/types";

function serializeOrder(order: Order, sellerName = "Vendeur", product?: Product) {
  return {
    id: order.id,
    productName: order.productName,
    productImage: product?.image || "",
    productDescription: product?.description || "",
    sellerName,
    clientName: order.clientName,
    amount: getOrderTotal(order),
    status: order.status,
    paidAt: order.paidAt,
    deliveryValidatedAt: order.deliveryValidatedAt,
    disputeOpenedAt: order.disputeOpenedAt,
  };
}

const MAX_MEDIA_ITEMS = 10;
const MAX_IMAGE_BYTES = 2_000_000;
const MAX_VIDEO_BYTES = 8_000_000;

function approxBytesFromDataUrl(url: string): number {
  const base64 = url.split(",")[1] || "";
  return Math.floor((base64.length * 3) / 4);
}

function normalizeMedia(value: unknown): DisputeMedia | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<DisputeMedia>;
  if (item.type !== "image" && item.type !== "video") return null;
  if (typeof item.url !== "string") return null;

  const imageOk =
    item.type === "image" && /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(item.url);
  const videoOk =
    item.type === "video" && /^data:video\/(mp4|webm|quicktime);base64,/i.test(item.url);
  if (!imageOk && !videoOk) return null;

  const bytes = approxBytesFromDataUrl(item.url);
  if (item.type === "image" && bytes > MAX_IMAGE_BYTES) return null;
  if (item.type === "video" && bytes > MAX_VIDEO_BYTES) return null;

  return {
    type: item.type,
    url: item.url,
    name: typeof item.name === "string" ? item.name.slice(0, 80) : undefined,
  };
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
    const product = await getProductById(order.productId);

    if (action === "lookup") {
      return NextResponse.json({
        order: serializeOrder(order, seller?.businessName || seller?.displayName, product),
      });
    }

    if (action === "submit") {
      const reason = String(body?.reason || "").trim();
      const submittedMedia = Array.isArray(body?.media) ? body.media : [];
      const media = submittedMedia.map(normalizeMedia).filter(Boolean) as DisputeMedia[];

      if (order.status === "dispute") {
        return NextResponse.json({
          order: serializeOrder(order, seller?.businessName || seller?.displayName, product),
          alreadyOpen: true,
        });
      }

      if (reason.length < 12) {
        return NextResponse.json(
          { error: "Expliquez le problème en quelques mots." },
          { status: 400 }
        );
      }

      if (media.length < 1 || media.length > MAX_MEDIA_ITEMS) {
        return NextResponse.json(
          { error: "Ajoutez entre 1 et 10 preuves (image ou vidéo courte)." },
          { status: 400 }
        );
      }

      const disputed = await openDisputeByPin(pin, {
        reason,
        media,
        photos: media.filter((item) => item.type === "image").map((item) => item.url),
      });
      if (!disputed) {
        return NextResponse.json(
          { error: "Le litige n'est possible qu'après validation de la livraison." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        order: serializeOrder(disputed, seller?.businessName || seller?.displayName, product),
      });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
