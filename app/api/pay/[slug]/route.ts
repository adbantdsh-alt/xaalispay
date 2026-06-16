import { NextResponse } from "next/server";
import {
  createOrderFromProduct,
  getOrderBySlug,
  getProductById,
  getProductByPaymentSlug,
  getProfileById,
  markPaymentInitiated,
  openDispute,
  processOrderMaintenance,
} from "@/lib/orders";
import { createBictorysMobileMoneyCharge } from "@/lib/bictorys";
import { getProtectionDurationMinutes } from "@/lib/protection";
import { isMobileMoneyMethod } from "@/lib/payment-methods";
import { getCheckoutBreakdown, calculateSellerCommission, FEE_POLICY } from "@/lib/fees";
import { getOrderTotal } from "@/lib/utils";
import { updateDb } from "@/lib/db";
import { getReusablePaymentAttempt, recordPaymentAttempt } from "@/lib/ledger";
import { resolveProductImageUrl } from "@/lib/product-images";
import type { Order, Product } from "@/lib/types";

function buildFeesPayload(
  prices: Pick<Order, "productPrice" | "deliveryCost" | "buyerProtectionFee">
) {
  const breakdown = getCheckoutBreakdown(prices);
  return {
    ...breakdown,
    sellerCommissionEstimate: calculateSellerCommission(breakdown.subtotal),
    policy: {
      buyer: FEE_POLICY.buyer.shortLabel,
      seller: FEE_POLICY.seller.shortLabel,
      payout: FEE_POLICY.payout.shortLabel,
    },
  };
}

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
    productImage: resolveProductImageUrl(product.image),
    productDescription: product.description || "",
    productNote: product.note || "",
    deliveryHours: product.deliveryHours,
    status: "pending_payment" as const,
    slug: product.paymentSlug,
    isProductLink: true,
    seller,
    fees: buildFeesPayload({ productPrice: product.price, deliveryCost: product.deliveryCost || 0 }),
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
    productImage: resolveProductImageUrl(product?.image),
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
    paymentProviderStatus: order.paymentProviderStatus,
    paymentProviderMessage: order.paymentProviderMessage,
    pin:
      order.status === "paid" || order.status === "protection"
        ? order.pin
        : undefined,
    protectionEndsAt: order.protectionEndsAt,
    deliveryDeadlineAt: order.deliveryDeadlineAt,
    seller,
    fees: buildFeesPayload({
      productPrice: order.productPrice,
      deliveryCost: order.deliveryCost || 0,
      buyerProtectionFee: order.buyerProtectionFee,
    }),
  };
}

export async function GET(
  request: Request,
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

      const payableOrder = await getOrderBySlug(order.slug);
      if (!payableOrder) {
        return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
      }
      if (payableOrder.status !== "pending_payment") {
        return NextResponse.json(
          {
            error: "Cette commande est déjà payée ou finalisée.",
            orderSlug: payableOrder.slug,
            status: payableOrder.status,
          },
          { status: 409 }
        );
      }

      const reusableAttempt = await getReusablePaymentAttempt(
        payableOrder.id,
        paymentMethod
      );
      if (reusableAttempt?.paymentUrl) {
        return NextResponse.json({
          pending: true,
          reused: true,
          status: "pending_payment",
          orderSlug: payableOrder.slug,
          paymentUrl: reusableAttempt.paymentUrl,
          qrCode: reusableAttempt.qrCode,
          message:
            reusableAttempt.message ||
            "Une demande de paiement est déjà en cours. Confirmez-la sur votre téléphone.",
        });
      }

      const charge = await createBictorysMobileMoneyCharge({
        order: payableOrder,
        method: paymentMethod,
      });

      await markPaymentInitiated(payableOrder.slug, {
        method: paymentMethod,
        providerId: charge.id,
        providerStatus: charge.status,
        providerMessage: charge.message,
      });
      await recordPaymentAttempt(payableOrder, {
        method: paymentMethod,
        providerId: charge.id,
        providerStatus: charge.status,
        providerMessage: charge.message,
        paymentUrl: charge.paymentUrl,
        qrCode: charge.qrCode,
      });

      return NextResponse.json({
        pending: true,
        status: "pending_payment",
        orderSlug: payableOrder.slug,
        paymentUrl: charge.paymentUrl,
        qrCode: charge.qrCode,
        message:
          charge.message ||
          "Confirmez le paiement sur votre téléphone. Le code livraison s'affichera après confirmation.",
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
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
