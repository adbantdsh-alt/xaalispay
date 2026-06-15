import { NextRequest, NextResponse } from "next/server";
import { getProfileByUsername, getProductsBySeller } from "@/lib/orders";
import { formatCurrency, getOrderTotal } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const clean = username.trim().replace(/^@+/, "").toLowerCase();
  if (!clean) {
    return NextResponse.json({ error: "XaalisTag invalide" }, { status: 400 });
  }

  const profile = await getProfileByUsername(clean);
  if (!profile) {
    return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });
  }

  const products = await getProductsBySeller(profile.id, true);

  return NextResponse.json({
    vendor: {
      username: profile.username,
      displayName: profile.displayName,
      businessName: profile.businessName,
    },
    products: products.map((p) => ({
      id: p.id,
      paymentSlug: p.paymentSlug,
      name: p.name,
      description: p.description,
      price: p.price,
      deliveryCost: p.deliveryCost || 0,
      total: getOrderTotal({ productPrice: p.price, deliveryCost: p.deliveryCost || 0 }),
      totalLabel: formatCurrency(
        getOrderTotal({ productPrice: p.price, deliveryCost: p.deliveryCost || 0 })
      ),
      image: p.image,
    })),
  });
}
