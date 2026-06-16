import { NextResponse } from "next/server";
import { getOrderBySlug, processOrderMaintenance } from "@/lib/orders";
import { toDeliverySession } from "@/lib/delivery-validation";
import { getProtectionDurationMinutes } from "@/lib/protection";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  await processOrderMaintenance();
  const order = await getOrderBySlug(slug);

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (order.status === "pending_payment") {
    return NextResponse.json({ error: "Commande non payée" }, { status: 409 });
  }

  return NextResponse.json({
    session: toDeliverySession(order),
    protectionMinutes: getProtectionDurationMinutes(),
  });
}
