import { NextResponse } from "next/server";
import { getOrderBySlug } from "@/lib/orders";
import { toDeliverySession } from "@/lib/delivery-validation";
import { getProtectionDurationMinutes } from "@/lib/protection";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const order = await getOrderBySlug(slug);

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  // Autoriser pending_payment : le client vient de payer, le webhook arrive sous peu.
  // Le composant affiche un spinner et poll jusqu'à confirmation.

  return NextResponse.json({
    session: toDeliverySession(order),
    protectionMinutes: getProtectionDurationMinutes(),
  });
}
