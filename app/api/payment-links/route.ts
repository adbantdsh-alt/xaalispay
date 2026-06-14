import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  createOrderFromProduct,
  createProduct,
  getProductById,
  getProfileById,
} from "@/lib/orders";
import { normalizeProductFields } from "@/lib/product-form";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      productId,
      product: inlineProduct,
      clientFirstName,
      clientLastName,
      clientPhone,
      clientNote,
    } = body;

    let product = productId ? getProductById(productId) : undefined;

    if (inlineProduct?.name) {
      const fields = normalizeProductFields(inlineProduct);
      if (!fields.name || fields.price <= 0 || fields.deliveryHours <= 0) {
        return NextResponse.json(
          { error: "Nom, prix et délai livraison requis" },
          { status: 400 }
        );
      }
      product = createProduct(user.id, fields);
    }

    if (!product || product.sellerId !== user.id || !product.active) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const order = createOrderFromProduct(product, {
      firstName: clientFirstName,
      lastName: clientLastName,
      phone: clientPhone,
      note: clientNote,
    });

    const profile = getProfileById(user.id);
    const origin = new URL(request.url).origin;

    return NextResponse.json({
      order: {
        id: order.id,
        slug: order.slug,
        payUrl: `${origin}/pay/${order.slug}`,
        productName: order.productName,
        total: order.productPrice + order.deliveryCost,
      },
      profile: profile ? { username: profile.username } : undefined,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
