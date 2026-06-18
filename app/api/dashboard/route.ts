import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getWalletData, validateDelivery } from "@/lib/orders";
import { resolveProductImageUrl } from "@/lib/product-images";
import { getSellerAccess } from "@/lib/profile-access";
import { getDb } from "@/lib/db";
import { getProtectionDurationMinutes } from "@/lib/protection";
import type { Product } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const [access, db] = await Promise.all([
    getSellerAccess(user.id, user.email),
    getDb(),
  ]);

  if (!access.profile) {
    return NextResponse.json({ error: "Profil vendeur introuvable" }, { status: 404 });
  }

  const sellerId = user.id;
  const orders = db.orders
    .filter((o) => o.sellerId === sellerId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  const products = db.products
    .filter((p) => p.sellerId === sellerId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ) as Product[];

  const wallet = await getWalletData(sellerId, {
    skipMaintenance: true,
    orders,
    db,
  });

  const hasSuccessfulPayout = db.payouts.some(
    (payout) => payout.sellerId === sellerId && payout.status === "success"
  );
  const imageByProductId = new Map(
    products.map((p) => [p.id, resolveProductImageUrl(p.image)])
  );

  return NextResponse.json({
    profile: access.profile,
    wallet: {
      available: wallet.available,
      sequestered: wallet.sequestered,
      sequesteredTotal: wallet.sequesteredTotal,
      breakdown: wallet.breakdown,
    },
    orders: wallet.orders.map((order) => ({
      ...order,
      productImage: imageByProductId.get(order.productId) || "",
    })),
    productCount: products.length,
    protectionMinutes: getProtectionDurationMinutes(),
    canCreateProducts: access.canCreateProducts,
    emailVerified: access.emailVerified,
    isSuperAdmin: access.isSuperAdmin,
    hasSuccessfulPayout,
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { orderId, pin } = await request.json();
    if (!orderId || !pin) {
      return NextResponse.json({ error: "Commande et PIN requis" }, { status: 400 });
    }

    const order = await validateDelivery(orderId, user.id, String(pin).trim());
    if (!order) {
      return NextResponse.json(
        { error: "PIN incorrect ou commande non éligible" },
        { status: 400 }
      );
    }

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
