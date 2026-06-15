import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  createProduct,
  getProductById,
  getProductsBySeller,
  updateProduct,
} from "@/lib/orders";
import { getSellerAccess } from "@/lib/profile-access";
import { normalizeProductFields } from "@/lib/product-form";
import { buildPaymentLinkUrl } from "@/lib/site-url";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const product = await getProductById(id);
    if (!product || product.sellerId !== user.id) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }
    return NextResponse.json({ product });
  }

  const products = await getProductsBySeller(user.id);
  return NextResponse.json({
    products: products.map(({ image, ...product }) => ({
      ...product,
      image: "",
      hasImage: Boolean(image),
    })),
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const access = await getSellerAccess(user.id, user.email);
  if (!access.canCreateProducts) {
    return NextResponse.json(
      {
        error:
          "Confirmez votre email pour créer des produits. Vérifiez votre boîte mail ou renvoyez le lien depuis la page connexion.",
        code: "EMAIL_NOT_VERIFIED",
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const fields = normalizeProductFields(body);

    if (!fields.name || fields.price <= 0 || fields.deliveryHours <= 0) {
      return NextResponse.json(
        { error: "Nom, prix et délai livraison requis" },
        { status: 400 }
      );
    }

    const product = await createProduct(user.id, fields);
    return NextResponse.json({
      product,
      payUrl: buildPaymentLinkUrl(product.paymentSlug),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur serveur";
    console.error("POST /api/products:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id, ...raw } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID produit requis" }, { status: 400 });
    }

    const data: Record<string, unknown> = { ...raw };
    if (raw.price !== undefined) data.price = Number(raw.price);
    if (raw.deliveryCost !== undefined) data.deliveryCost = Number(raw.deliveryCost);
    if (raw.deliveryHours !== undefined) data.deliveryHours = Number(raw.deliveryHours);

    const product = await updateProduct(id, user.id, data);
    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
