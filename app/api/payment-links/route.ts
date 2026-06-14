import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  createProduct,
  getProductById,
  getProfileById,
} from "@/lib/orders";
import { getSellerAccess } from "@/lib/profile-access";
import { normalizeProductFields } from "@/lib/product-form";
import { buildPaymentLinkUrl } from "@/lib/site-url";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productId, product: inlineProduct } = body;

    let product = productId ? getProductById(productId) : undefined;

    if (inlineProduct?.name) {
      const access = getSellerAccess(user.id, user.email);
      if (!access.canCreateProducts) {
        return NextResponse.json(
          {
            error: "Confirmez votre email pour créer des produits.",
            code: "EMAIL_NOT_VERIFIED",
          },
          { status: 403 }
        );
      }

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

    const profile = getProfileById(user.id);
    const payUrl = buildPaymentLinkUrl(product.paymentSlug);

    return NextResponse.json({
      order: {
        id: product.id,
        slug: product.paymentSlug,
        payUrl,
        productName: product.name,
        total: product.price + (product.deliveryCost || 0),
      },
      profile: profile ? { username: profile.username } : undefined,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
