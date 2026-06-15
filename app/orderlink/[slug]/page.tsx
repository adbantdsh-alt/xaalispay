"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getBuyerTimeline, getBuyerHumanStatus } from "@/lib/order-timeline";
import { MoneyTimeline } from "@/components/ui/MoneyTimeline";
import { CopyButton } from "@/components/ui/CopyButton";
import { BrandMark } from "@/components/ui/BrandMark";
import { IconLock, IconCheck, IconAlert, IconUndo } from "@/components/ui/AppIcon";
import { PaySkeleton } from "@/components/ui/Skeleton";
import { buildPinShareMessage, buildWhatsAppUrl } from "@/lib/share";
import { PayOrderSummary, PayProtectionBlock, PayClientFields, PayMethodButtons, PayCheckoutSection, PinConsentGate } from "@/components/pay/PayPageSections";
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
  const [pin, setPin] = useState("");
  const [pinConsent, setPinConsent] = useState(false);
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
        if (data.order.pin) {
          setPin(data.order.pin);
          setPinConsent(true);
        }
      }
    }
    setLoading(false);
  }, [paymentReturn, pollSlug, trackingSlug]);

  useEffect(() => {
    fetchOrder();
    if (isProductLink && !trackingSlug) return;
    const interval = setInterval(fetchOrder, 4000);
    return () => clearInterval(interval);
  }, [fetchOrder, isProductLink, trackingSlug]);

  const handleMaintenance = async () => {
    await fetch("/api/maintenance", { method: "POST" });
    fetchOrder();
  };

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
    setPin("");
    setPinConsent(false);
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

  const canDispute = status === "protection" && !!order.protectionEndsAt;
  const visiblePin = pin || order.pin || "";
  const showPin = visiblePin && (status === "paid" || canDispute);

  if (!order.isProductLink && status === "pending_payment") {
    const returnedAfterPayment = paymentReturn === "success";
    const paymentFailed = paymentReturn === "failed";

    return (
      <div className="page-shell status-screen">
        <BrandMark />
        <p className="status-screen-icon" aria-hidden="true">
          {paymentFailed ? <IconAlert size={36} /> : returnedAfterPayment ? <IconCheck size={36} /> : <IconLock size={36} />}
        </p>
        <h2 className="status-screen-title">
          {paymentFailed
            ? "Paiement non finalisé"
            : returnedAfterPayment
              ? "Paiement reçu"
              : "Paiement en attente"}
        </h2>
        <p className="status-screen-desc">
          {paymentFailed
            ? "Le paiement n'a pas été confirmé. Vous pouvez revenir au lien de paiement et réessayer."
            : returnedAfterPayment
              ? "Nous confirmons la transaction. Le code livraison va s'afficher automatiquement dans quelques instants."
              : order.paymentProviderMessage ||
                "Confirmez la demande de paiement sur votre téléphone. Le code livraison s'affichera ici après confirmation."}
        </p>
        <MoneyTimeline steps={getBuyerTimeline(status)} />
      </div>
    );
  }

  if (paid && showPin) {
    return (
      <div className="pay-success-screen">
        <BrandMark size="lg" />
        <div className="pay-success-card animate-fade-up" style={{ marginTop: "2rem" }}>
          <div className="pay-success-ring">
            <div className="pay-success-check">
              <IconCheck size={24} />
            </div>
          </div>
          <h1 className="pay-success-title">Paiement confirmé</h1>
          <p className="pay-success-sub">{getBuyerHumanStatus(status)}</p>
          <MoneyTimeline steps={getBuyerTimeline(status)} />

          <PinConsentGate accepted={pinConsent} onAcceptChange={setPinConsent}>
            <div className="pay-pin-block">
              <p className="pay-pin-label">Code Livraison</p>
              <p className="pay-pin-code">{visiblePin}</p>
            </div>

            <p className="pay-pin-hint">
              Donnez ce code au livreur après vérification du colis.
            </p>

            <div className="share-buttons">
              <CopyButton text={visiblePin} label="Copier" className="btn-primary pay-code-action" />
              <a
                href={buildWhatsAppUrl(buildPinShareMessage(visiblePin, order.productName))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary share-btn-whatsapp pay-code-action"
                style={{
                  background: "linear-gradient(135deg,#25d366,#128c7e)",
                  color: "#fff",
                  border: "none",
                }}
              >
                WhatsApp
              </a>
            </div>
          </PinConsentGate>

          {canDispute && pinConsent && (
            <div className="pay-dispute-minimal">
              <ReleaseCountdownInline
                endsAt={order.protectionEndsAt!}
                minutes={protectionMinutes}
                onExpire={handleMaintenance}
              />
              <Link href={`/litige?code=${visiblePin}`} className="btn-ghost dispute-link">
                Ouvrir un litige
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="pay-success-screen">
        <div className="pay-success-card animate-fade-up">
          <div className="pay-success-ring">
            <div className="pay-success-check">
              <IconCheck size={24} />
            </div>
          </div>
          <h1 className="pay-success-title">Paiement confirmé</h1>
          <p className="pay-success-sub">{getBuyerHumanStatus(status)}</p>
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
            Livraison estimée : <strong>{order.deliveryHours} h</strong>
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

function ReleaseCountdownInline({
  endsAt,
  minutes,
  onExpire,
}: {
  endsAt: string;
  minutes: number;
  onExpire?: () => void;
}) {
  const [remaining, setRemaining] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const ms = new Date(endsAt).getTime() - Date.now();
      if (ms <= 0) {
        setRemaining(0);
        if (!expired) {
          setExpired(true);
          onExpire?.();
        }
        return;
      }
      setRemaining(ms);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt, expired, onExpire]);

  const total = Math.floor(remaining / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const display = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  const progress = Math.max(0, Math.min(100, (remaining / (minutes * 60 * 1000)) * 100));

  return (
    <div className="countdown-card countdown-card-inline">
      <p className="countdown-label">Délai litige</p>
      <p className="countdown-time countdown-time-sm">{display}</p>
      <div className="countdown-bar">
        <div className="countdown-bar-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
