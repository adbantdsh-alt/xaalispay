import { NextResponse } from "next/server";
import {
  createOrderFromProduct,
  getOrderBySlug,
  getProductById,
  getProductByPaymentSlug,
  getProfileById,
  openDispute,
  processOrderMaintenance,
  processPayment,
} from "@/lib/orders";
import { getProtectionDurationMinutes } from "@/lib/protection";
import { isMobileMoneyMethod } from "@/lib/payment-methods";
import { updateDb } from "@/lib/db";
import type { Order, Product } from "@/lib/types";

async function buildSellerPayload(sellerId: string) {
  const seller = await getProfileById(sellerId);
  return {
    displayName: seller?.displayName || "Vendeur",
    username: seller?.username || "",
    businessName: seller?.businessName,
    phone: seller?.phone,
  };
}

function buildProductPayPayload(
  product: Product,
  seller: Awaited<ReturnType<typeof buildSellerPayload>>
) {
  return {
    productName: product.name,
    productPrice: product.price,
    deliveryCost: product.deliveryCost || 0,
    productImage: product.image || "",
    productDescription: product.description || "",
    productNote: product.note || "",
    deliveryHours: product.deliveryHours,
    status: "pending_payment" as const,
    slug: product.paymentSlug,
    isProductLink: true,
    seller,
  };
}

async function buildOrderPayPayload(order: Order) {
  const [product, seller] = await Promise.all([
    getProductById(order.productId),
    buildSellerPayload(order.sellerId),
  ]);
  return {
    productName: order.productName,
    productPrice: order.productPrice,
    deliveryCost: order.deliveryCost || 0,
    productImage: product?.image || "",
    productDescription: product?.description || "",
    productNote: product?.note || "",
    deliveryHours: order.deliveryHours,
    status: order.status,
    slug: order.slug,
    isProductLink: false,
    clientName: order.clientName,
    clientFirstName: order.clientFirstName,
    clientPhone: order.clientPhone,
    clientAddress: order.clientAddress,
    clientNote: order.clientNote,
    pin:
      order.status === "paid" || order.status === "protection"
        ? order.pin
        : undefined,
    protectionEndsAt: order.protectionEndsAt,
    deliveryDeadlineAt: order.deliveryDeadlineAt,
    seller,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  await processOrderMaintenance();

  const order = await getOrderBySlug(slug);
  if (order) {
    return NextResponse.json({
      order: await buildOrderPayPayload(order),
      protectionMinutes: getProtectionDurationMinutes(),
    });
  }

  const product = await getProductByPaymentSlug(slug);
  if (!product || !product.active) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  }

  const seller = await buildSellerPayload(product.sellerId);
  return NextResponse.json({
    order: buildProductPayPayload(product, seller),
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
    const {
      action,
      paymentMethod,
      clientFirstName,
      clientLastName,
      clientName,
      clientPhone,
      clientAddress,
    } = body;

    if (action === "pay") {
      if (!paymentMethod || !isMobileMoneyMethod(paymentMethod)) {
        return NextResponse.json(
          { error: "Choisissez Wave ou Orange Money" },
          { status: 400 }
        );
      }

      const firstName = (clientFirstName || "").trim();
      const lastName = (clientLastName || "").trim();
      const fullName =
        [firstName, lastName].filter(Boolean).join(" ").trim() ||
        (clientName || "").trim();

      if (!fullName || !clientPhone?.trim() || !clientAddress?.trim()) {
        return NextResponse.json(
          { error: "Prénom, nom, téléphone et adresse obligatoires" },
          { status: 400 }
        );
      }

      let order = await getOrderBySlug(slug);

      if (!order) {
        const product = await getProductByPaymentSlug(slug);
        if (!product || !product.active) {
          return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
        }
        order = await createOrderFromProduct(product, {
          firstName,
          lastName,
          phone: clientPhone.trim(),
          address: clientAddress.trim(),
        });
      } else if (order.status === "pending_payment") {
        await updateDb((db) => {
          const o = db.orders.find((x) => x.slug === slug);
          if (!o) return;
          o.clientName = fullName;
          o.clientFirstName = firstName;
          o.clientPhone = clientPhone.trim();
          o.clientAddress = clientAddress.trim();
          o.updatedAt = new Date().toISOString();
        });
      }

      const paid = await processPayment(order.slug, paymentMethod);
      if (!paid) {
        return NextResponse.json({ error: "Paiement impossible" }, { status: 400 });
      }

      return NextResponse.json({
        pin: paid.pin,
        status: paid.status,
        orderSlug: paid.slug,
      });
    }

    if (action === "dispute") {
      const ok = await openDispute(slug, {
        reason: String(body.reason || ""),
        photos: Array.isArray(body.photos) ? body.photos : [],
      });
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
