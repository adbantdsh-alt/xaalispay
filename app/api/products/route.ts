import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import {
  createProduct,
  getProductsBySeller,
  updateProduct,
} from "@/lib/orders";

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
    const { name, description, price, deliveryHours, image } = await request.json();

    if (!name?.trim() || price === undefined || !deliveryHours) {
      return NextResponse.json(
        { error: "Nom, prix et délai de livraison requis" },
        { status: 400 }
      );
    }

    const product = createProduct(user.id, {
      name: name.trim(),
      description: (description || "").trim(),
      price: Number(price),
      deliveryHours: Number(deliveryHours),
      image: image || "",
    });

    return NextResponse.json({ product });
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
    const { id, ...data } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID produit requis" }, { status: 400 });
    }

    const product = updateProduct(id, user.id, {
      ...data,
      price: data.price !== undefined ? Number(data.price) : undefined,
      deliveryHours:
        data.deliveryHours !== undefined ? Number(data.deliveryHours) : undefined,
    });

    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
