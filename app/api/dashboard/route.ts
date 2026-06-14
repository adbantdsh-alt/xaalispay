import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  getOrdersBySeller,
  getProfileById,
  getWalletData,
  processOrderMaintenance,
  validateDelivery,
} from "@/lib/orders";
import { getProtectionDurationMinutes } from "@/lib/protection";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  processOrderMaintenance();
  const profile = getProfileById(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Profil vendeur introuvable" }, { status: 404 });
  }

  const wallet = getWalletData(user.id);
  const orders = getOrdersBySeller(user.id);

  return NextResponse.json({
    profile,
    wallet,
    orders,
    protectionMinutes: getProtectionDurationMinutes(),
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

    const order = validateDelivery(orderId, user.id, String(pin).trim());
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
