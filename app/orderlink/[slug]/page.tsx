"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getBuyerTimeline, getBuyerHumanStatus } from "@/lib/order-timeline";
import { MoneyTimeline } from "@/components/ui/MoneyTimeline";
import { BrandMark } from "@/components/ui/BrandMark";
import { IconLock, IconCheck, IconAlert, IconUndo } from "@/components/ui/AppIcon";
import { PaySkeleton } from "@/components/ui/Skeleton";
import { DeliveryValidation } from "@/components/delivery/DeliveryValidation";
import { PayOrderSummary, PayProtectionBlock, PayClientFields, PayMethodButtons, PayCheckoutSection } from "@/components/pay/PayPageSections";
import { calculateBuyerProtectionFee } from "@/lib/fees";
import { formatDeliveryWindow } from "@/lib/delivery-window";
import type { OrderStatus } from "@/lib/types";

interface PayOrder {
  productName: string;
  productPrice: number;
  deliveryCost: number;
  productImage?: string;
  productDescription?: string;
  productNote?: string;
  deliveryHours?: number;
  status: string;
  slug: string;
  isProductLink?: boolean;
  pin?: string;
  protectionEndsAt?: string;
  clientName?: string;
  clientFirstName?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientNote?: string;
  paymentProviderStatus?: string;
  paymentProviderMessage?: string;
  seller: { displayName: string; username: string; phone?: string };
  fees?: {
    subtotal: number;
    buyerProtectionFee: number;
    checkoutTotal: number;
  };
}

export default function PayPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<PayOrder | null>(null);
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [trackingSlug, setTrackingSlug] = useState<string | null>(null);
  const [isProductLink, setIsProductLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [protectionMinutes, setProtectionMinutes] = useState(30);
  const [error, setError] = useState("");

  const pollSlug = trackingSlug || slug;
  const paymentReturn = searchParams.get("payment");

  const fetchOrder = useCallback(async () => {
    const query = paymentReturn ? `?payment=${encodeURIComponent(paymentReturn)}` : "";
    const res = await fetch(`/api/pay/${pollSlug}${query}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
      setProtectionMinutes(data.protectionMinutes || 30);
      setIsProductLink(!!data.order.isProductLink);
      if (!trackingSlug && data.order.isProductLink) {
        setPaid(false);
        setLoading(false);
        return;
      }
      if (data.order.status !== "pending_payment") {
        setPaid(true);
      }
    }
    setLoading(false);
  }, [paymentReturn, pollSlug, trackingSlug]);

  useEffect(() => {
    fetchOrder();
    if (isProductLink && !trackingSlug) return;
    const interval = setInterval(fetchOrder, 8000);
    return () => clearInterval(interval);
  }, [fetchOrder, isProductLink, trackingSlug]);

  const handlePay = async (method: string) => {
    if (
      !clientFirstName.trim() ||
      !clientLastName.trim() ||
      !clientPhone.trim() ||
      !clientAddress.trim()
    ) {
      setError("Prénom, nom, téléphone et adresse obligatoires");
      return;
    }
    setError("");
    setPaying(true);
    const res = await fetch(`/api/pay/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "pay",
        paymentMethod: method,
        clientFirstName: clientFirstName.trim(),
        clientLastName: clientLastName.trim(),
        clientPhone: clientPhone.trim(),
        clientAddress: clientAddress.trim(),
      }),
    });
    const data = await res.json();
    setPaying(false);
    if (!res.ok) {
      setError(data.error || "Paiement impossible");
      return;
    }
    if (data.paymentUrl) {
      window.location.href = data.paymentUrl;
      return;
    }
    setPaid(false);
    if (data.orderSlug) {
      setTrackingSlug(data.orderSlug);
      setIsProductLink(false);
      router.replace(`/orderlink/${data.orderSlug}`);
      const trackRes = await fetch(`/api/pay/${data.orderSlug}`);
      if (trackRes.ok) {
        const trackData = await trackRes.json();
        setOrder(trackData.order);
      }
    }
    if (data.message) setError(data.message);
  };

  if (loading) {
    return (
      <div className="page-shell" style={{ padding: "1.25rem" }}>
        <PaySkeleton />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-shell status-screen">
        <p className="status-screen-desc">Lien de paiement invalide</p>
      </div>
    );
  }

  const status = order.status as OrderStatus;

  if (["dispute", "refunded", "released"].includes(status)) {
    const meta = {
      dispute: { Icon: IconAlert, title: "Litige ouvert", desc: "Examen en cours." },
      refunded: { Icon: IconUndo, title: "Remboursé", desc: "Votre argent vous a été rendu." },
      released: { Icon: IconCheck, title: "Terminé", desc: "Transaction finalisée." },
    } as const;
    const { Icon, title, desc } = meta[status as keyof typeof meta];
    return (
      <div className="page-shell status-screen">
        <BrandMark />
        <p className="status-screen-icon" aria-hidden="true">
          <Icon size={36} />
        </p>
        <h2 className="status-screen-title">{title}</h2>
        <p className="status-screen-desc">{desc}</p>
        <MoneyTimeline steps={getBuyerTimeline(status)} />
      </div>
    );
  }

  // Dès que le client revient du paiement (success) ou que le statut est paid/protection,
  // afficher directement le code — pas d'écran intermédiaire.
  const showDelivery =
    paid ||
    (paymentReturn === "success" && !order.isProductLink) ||
    status === "paid" ||
    status === "protection";

  if (showDelivery) {
    const paymentFailed = paymentReturn === "failed";
    if (paymentFailed) {
      return (
        <div className="page-shell status-screen">
          <BrandMark />
          <p className="status-screen-icon" aria-hidden="true">
            <IconAlert size={36} />
          </p>
          <h2 className="status-screen-title">Paiement non finalisé</h2>
          <p className="status-screen-desc">
            Le paiement n&apos;a pas été confirmé. Revenez au lien de paiement et réessayez.
          </p>
          <MoneyTimeline steps={getBuyerTimeline(status)} />
        </div>
      );
    }

    return (
      <div className="pay-success-screen">
        <BrandMark size="lg" />
        <div className="pay-success-card animate-fade-up" style={{ marginTop: "2rem", maxWidth: 480 }}>
          <div className="pay-success-ring">
            <div className="pay-success-check">
              <IconCheck size={24} />
            </div>
          </div>
          <h1 className="pay-success-title">Paiement confirmé</h1>
          <MoneyTimeline steps={getBuyerTimeline(status)} />
          <div style={{ marginTop: "1.25rem" }}>
            <DeliveryValidation
              orderSlug={pollSlug}
              productName={order.productName}
              protectionMinutes={protectionMinutes}
              onSessionChange={fetchOrder}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pay-app">
      <header className="pay-brand-bar">
        <BrandMark />
        <span className="pay-secure-pill">
          <IconLock size={14} />
          Sécurisé
        </span>
      </header>

      <div className="pay-sheet pay-sheet-flat animate-fade-up">
        <div className="pay-sheet-handle" />

        <PayOrderSummary
          productName={order.productName}
          productImage={order.productImage}
          productPrice={order.productPrice}
          deliveryCost={order.deliveryCost || 0}
          buyerProtectionFee={
            order.fees?.buyerProtectionFee ??
            calculateBuyerProtectionFee(order.productPrice + (order.deliveryCost || 0))
          }
          seller={order.seller}
        />

        <PayProtectionBlock protectionMinutes={protectionMinutes} />

        {(order.productDescription || order.productNote) && (
          <div className="pay-product-details">
            {order.productDescription && (
              <p className="pay-product-desc">{order.productDescription}</p>
            )}
            {order.productNote && (
              <p className="pay-client-note">
                <span>Détail vendeur :</span> {order.productNote}
              </p>
            )}
          </div>
        )}

        {order.deliveryHours ? (
          <p className="pay-delivery-meta">
            Livraison estimée : <strong>{formatDeliveryWindow(order.deliveryHours)}</strong>
          </p>
        ) : null}

        <PayCheckoutSection>
          <PayClientFields
            values={{
              firstName: clientFirstName,
              lastName: clientLastName,
              phone: clientPhone,
              address: clientAddress,
            }}
            onChange={(v) => {
              setClientFirstName(v.firstName);
              setClientLastName(v.lastName);
              setClientPhone(v.phone);
              setClientAddress(v.address);
            }}
          />
        </PayCheckoutSection>

        <PayMethodButtons onPay={handlePay} paying={paying} />

        {error && <p className="alert-danger">{error}</p>}
      </div>
    </div>
  );
}
