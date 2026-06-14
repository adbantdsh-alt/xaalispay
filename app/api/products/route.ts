import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  createProduct,
  getProductsBySeller,
  updateProduct,
} from "@/lib/orders";
import { normalizeProductFields } from "@/lib/product-form";
import { buildPaymentLinkUrl } from "@/lib/site-url";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const products = getProductsBySeller(user.id);
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
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

    const product = createProduct(user.id, fields);
    return NextResponse.json({
      product,
      payUrl: buildPaymentLinkUrl(product.paymentSlug),
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
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

    const product = updateProduct(id, user.id, data);
    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
