import { NextResponse } from "next/server";
import { processOrderMaintenance } from "@/lib/orders";
import { getProtectionDurationMinutes } from "@/lib/protection";
import { confirmClientDelivery, toDeliverySession } from "@/lib/delivery-validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const body = await request.json();
    const pin = String(body.pin || "").trim();

    const result = await confirmClientDelivery(slug, pin);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await processOrderMaintenance();

    return NextResponse.json({
      success: true,
      session: toDeliverySession(result.order),
      protectionMinutes: getProtectionDurationMinutes(),
      message: "Réception confirmée. Séquestre Flash activé — vous pouvez ouvrir un litige sous 30 minutes.",
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
