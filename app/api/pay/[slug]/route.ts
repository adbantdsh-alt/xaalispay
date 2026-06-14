import { NextResponse } from "next/server";
import {
  getOrderBySlug,
  getProductById,
  getProfileById,
  openDispute,
  processOrderMaintenance,
  processPayment,
} from "@/lib/orders";
import { getProtectionDurationMinutes } from "@/lib/protection";
import { isMobileMoneyMethod } from "@/lib/payment-methods";
import { readDb, updateDb } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  processOrderMaintenance();

  const order = getOrderBySlug(slug);
  if (!order) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  }

  const seller = getProfileById(order.sellerId);
  const product = getProductById(order.productId);

  return NextResponse.json({
    order: {
      productName: order.productName,
      productPrice: order.productPrice,
      deliveryCost: order.deliveryCost || 0,
      productImage: product?.image || "",
      productDescription: product?.description || "",
      productNote: product?.note || "",
      deliveryHours: order.deliveryHours,
      status: order.status,
      slug: order.slug,
      clientName: order.clientName,
      clientFirstName: order.clientFirstName,
      clientPhone: order.clientPhone,
      clientNote: order.clientNote,
      pin:
        order.status === "paid" || order.status === "protection"
          ? order.pin
          : undefined,
      protectionEndsAt: order.protectionEndsAt,
      deliveryDeadlineAt: order.deliveryDeadlineAt,
      seller: {
        displayName: seller?.displayName || "Vendeur",
        username: seller?.username || "",
        businessName: seller?.businessName,
        phone: seller?.phone,
      },
    },
    protectionMinutes: getProtectionDurationMinutes(),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const body = await request.json();
    const { action, paymentMethod, clientName, clientPhone } = body;

    if (action === "pay") {
      if (!paymentMethod || !isMobileMoneyMethod(paymentMethod)) {
        return NextResponse.json(
          { error: "Choisissez Wave ou Orange Money" },
          { status: 400 }
        );
      }

      if (!clientName?.trim() || !clientPhone?.trim()) {
        return NextResponse.json(
          { error: "Nom et téléphone obligatoires" },
          { status: 400 }
        );
      }

      updateDb((db) => {
        const order = db.orders.find((o) => o.slug === slug);
        if (order && order.status === "pending_payment") {
          order.clientName = clientName.trim();
          order.clientPhone = clientPhone.trim();
          order.updatedAt = new Date().toISOString();
        }
      });

      const order = processPayment(slug, paymentMethod);
      if (!order) {
        return NextResponse.json({ error: "Paiement impossible" }, { status: 400 });
      }

      return NextResponse.json({ pin: order.pin, status: order.status });
    }

    if (action === "dispute") {
      const ok = openDispute(slug);
      if (!ok) {
        return NextResponse.json(
          { error: "Litige impossible pendant cette étape" },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
