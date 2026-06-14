import { NextResponse } from "next/server";
import {
  getProductById,
  getProfileByUsername,
} from "@/lib/orders";
import { buildPaymentLinkPath } from "@/lib/site-url";

export async function POST(request: Request) {
  try {
    const { username, productId } = await request.json();

    if (!username || !productId) {
      return NextResponse.json(
        { error: "Vendeur et produit requis" },
        { status: 400 }
      );
    }

    const profile = await getProfileByUsername(username);
    if (!profile) {
      return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });
    }

    const product = await getProductById(productId);
    if (!product || product.sellerId !== profile.id || !product.active) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      order: { slug: product.paymentSlug },
      payPath: buildPaymentLinkPath(product.paymentSlug),
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
