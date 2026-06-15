import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  getWalletData,
  processOrderMaintenance,
  validateDelivery,
} from "@/lib/orders";
import { getSellerAccess } from "@/lib/profile-access";
import { getProtectionDurationMinutes } from "@/lib/protection";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  await processOrderMaintenance();
  const access = await getSellerAccess(user.id, user.email);
  if (!access.profile) {
    return NextResponse.json({ error: "Profil vendeur introuvable" }, { status: 404 });
  }

  const wallet = await getWalletData(user.id, { skipMaintenance: true });

  return NextResponse.json({
    profile: access.profile,
    wallet: {
      available: wallet.available,
      sequestered: wallet.sequestered,
      sequesteredTotal: wallet.sequesteredTotal,
      breakdown: wallet.breakdown,
    },
    orders: wallet.orders,
    protectionMinutes: getProtectionDurationMinutes(),
    canCreateProducts: access.canCreateProducts,
    emailVerified: access.emailVerified,
    isSuperAdmin: access.isSuperAdmin,
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
