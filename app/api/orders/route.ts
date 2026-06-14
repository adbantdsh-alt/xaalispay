import { NextResponse } from "next/server";
import {
  createOrderFromProduct,
  getProductById,
  getProfileByUsername,
  processOrderMaintenance,
} from "@/lib/orders";

export async function POST(request: Request) {
  try {
    processOrderMaintenance();
    const { username, productId } = await request.json();

    if (!username || !productId) {
      return NextResponse.json(
        { error: "Vendeur et produit requis" },
        { status: 400 }
      );
    }

    const profile = getProfileByUsername(username);
    if (!profile) {
      return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });
    }

    const product = getProductById(productId);
    if (!product || product.sellerId !== profile.id || !product.active) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const order = createOrderFromProduct(product, "", "");

    return NextResponse.json({
      order: { id: order.id, slug: order.slug },
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
