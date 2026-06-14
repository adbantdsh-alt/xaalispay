"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MOBILE_MONEY_METHODS } from "@/lib/payment-methods";
import { formatCurrency, getOrderTotal } from "@/lib/utils";
import { getBuyerTimeline, getBuyerHumanStatus } from "@/lib/order-timeline";
import { MoneyTimeline } from "@/components/ui/MoneyTimeline";
import { CopyButton } from "@/components/ui/CopyButton";
import { BrandMark } from "@/components/ui/BrandMark";
import { PayMethodLogo } from "@/components/ui/PayMethodLogo";
import { PaySkeleton } from "@/components/ui/Skeleton";
import { buildPinShareMessage, buildWhatsAppUrl } from "@/lib/share";
import type { OrderStatus } from "@/lib/types";

interface PayOrder {
  productName: string;
  productPrice: number;
  deliveryCost: number;
  productImage?: string;
  status: string;
  slug: string;
  pin?: string;
  protectionEndsAt?: string;
  clientName?: string;
  clientPhone?: string;
  clientNote?: string;
  seller: { displayName: string; username: string };
}

export default function PayPage() {
  const { slug } = useParams<{ slug: string }>();
  const [order, setOrder] = useState<PayOrder | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [pin, setPin] = useState("");
  const [protectionMinutes, setProtectionMinutes] = useState(30);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeError, setDisputeError] = useState("");
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    const res = await fetch(`/api/pay/${slug}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
      setProtectionMinutes(data.protectionMinutes || 30);
      if (data.order.clientName && !clientName) {
        setClientName(data.order.clientName);
      }
      if (data.order.clientPhone && !clientPhone) {
        setClientPhone(data.order.clientPhone);
      }
      if (data.order.status !== "pending_payment") {
        setPaid(true);
        if (data.order.pin) setPin(data.order.pin);
      }
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 4000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const handleMaintenance = async () => {
    await fetch("/api/maintenance", { method: "POST" });
    fetchOrder();
  };

  const handlePay = async (method: string) => {
    if (!clientName.trim() || !clientPhone.trim()) {
      setError("Nom et téléphone obligatoires");
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
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
      }),
    });
    const data = await res.json();
    setPaying(false);
    if (!res.ok) {
      setError(data.error || "Paiement impossible");
      return;
    }
    setPaid(true);
    setPin(data.pin);
    fetchOrder();
  };

  const handleDispute = async () => {
    setDisputeError("");
    if (!disputeReason.trim()) {
      setDisputeError("Décrivez le problème");
      return;
    }
    const res = await fetch(`/api/pay/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dispute", reason: disputeReason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setDisputeError(data.error || "Litige impossible");
      return;
    }
    setShowDispute(false);
    fetchOrder();
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
      dispute: ["⚠️", "Litige ouvert", "Examen en cours."],
      refunded: ["↩", "Remboursé", "Votre argent vous a été rendu."],
      released: ["✓", "Terminé", "Transaction finalisée."],
    } as const;
    const [icon, title, desc] = meta[status as keyof typeof meta];
    return (
      <div className="page-shell status-screen">
        <BrandMark />
        <p className="status-screen-icon">{icon}</p>
        <h2 className="status-screen-title">{title}</h2>
        <p className="status-screen-desc">{desc}</p>
        <MoneyTimeline steps={getBuyerTimeline(status)} />
      </div>
    );
  }

  const canDispute = status === "protection" && !!order.protectionEndsAt;
  const showPin = pin && (status === "paid" || canDispute);

  if (paid && showPin) {
    return (
      <div className="pay-success-screen">
        <BrandMark size="lg" />
        <div className="pay-success-card animate-fade-up" style={{ marginTop: "2rem" }}>
          <div className="pay-success-ring">
            <div className="pay-success-check">✓</div>
          </div>
          <h1 className="pay-success-title">Paiement confirmé</h1>
          <p className="pay-success-sub">{getBuyerHumanStatus(status)}</p>
          <MoneyTimeline steps={getBuyerTimeline(status)} />

          <div className="pay-pin-block">
            <p className="pay-pin-label">Code Livraison</p>
            <p className="pay-pin-code">{pin}</p>
          </div>

          <p className="pay-pin-hint">
            Donnez ce code au livreur après vérification du colis.
          </p>

          <div className="share-buttons">
            <CopyButton text={pin} label="Copier le code" className="btn-primary" />
            <a
              href={buildWhatsAppUrl(buildPinShareMessage(pin, order.productName))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary share-btn-whatsapp"
              style={{ background: "linear-gradient(135deg,#25d366,#128c7e)", color: "#fff", border: "none" }}
            >
              Partager sur WhatsApp
            </a>
          </div>

          {canDispute && (
            <div className="pay-dispute-minimal">
              <ReleaseCountdownInline
                endsAt={order.protectionEndsAt!}
                minutes={protectionMinutes}
                onExpire={handleMaintenance}
              />
              {!showDispute ? (
                <button type="button" onClick={() => setShowDispute(true)} className="btn-ghost dispute-link">
                  Signaler un problème
                </button>
              ) : (
                <div className="dispute-form">
                  <textarea
                    className="input-field dispute-textarea"
                    placeholder="Décrivez le problème…"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                  />
                  {disputeError && <p className="alert-danger">{disputeError}</p>}
                  <div className="dispute-actions">
                    <button type="button" onClick={handleDispute} className="btn-primary">Envoyer</button>
                    <button type="button" onClick={() => setShowDispute(false)} className="btn-secondary">Annuler</button>
                  </div>
                </div>
              )}
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
          <div className="pay-success-ring"><div className="pay-success-check">✓</div></div>
          <h1 className="pay-success-title">Paiement confirmé</h1>
          <p className="pay-success-sub">{getBuyerHumanStatus(status)}</p>
        </div>
      </div>
    );
  }

  const initial = order.seller.displayName.charAt(0).toUpperCase();
  const total = getOrderTotal({
    productPrice: order.productPrice,
    deliveryCost: order.deliveryCost || 0,
  });

  return (
    <div className="pay-app">
      <header className="pay-brand-bar">
        <BrandMark />
        <span className="pay-secure-pill">🔒 Sécurisé</span>
      </header>

      <div className="pay-hero animate-fade-up">
        {order.productImage ? (
          <img src={order.productImage} alt={order.productName} className="pay-hero-img" />
        ) : (
          <div className="pay-hero-placeholder">📦</div>
        )}
        <div className="pay-hero-gradient" />
        <div className="pay-hero-content">
          <p className="pay-hero-title">{order.productName}</p>
          <p className="pay-hero-price">{formatCurrency(total)}</p>
          {(order.deliveryCost || 0) > 0 && (
            <p className="pay-hero-subprice">
              {formatCurrency(order.productPrice)} + {formatCurrency(order.deliveryCost)} livraison
            </p>
          )}
        </div>
      </div>

      <div className="pay-sheet animate-fade-up-d1">
        <div className="pay-sheet-handle" />

        <div className="pay-vendor-row">
          <div className="pay-vendor-avatar">{initial}</div>
          <div>
            <p className="pay-vendor-name">{order.seller.displayName}</p>
            <p className="pay-vendor-meta">@{order.seller.username} · Vendeur vérifié</p>
          </div>
        </div>

        <p className="pay-reassurance">
          <span>🛡️</span>
          Votre argent reste bloqué chez XaalisPay jusqu&apos;à réception du colis.
        </p>

        <MoneyTimeline steps={getBuyerTimeline("pending_payment")} />

        {order.clientNote && (
          <p className="pay-client-note">
            <span>Note du vendeur :</span> {order.clientNote}
          </p>
        )}

        <div className="pay-methods-stack">
          {MOBILE_MONEY_METHODS.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => handlePay(method.id)}
              disabled={paying}
              className={`pay-method ${method.btnClass}`}
            >
              <PayMethodLogo method={method.id} />
              <span className="pay-method-text">Payer avec {method.name}</span>
              <span className="pay-method-arrow">→</span>
            </button>
          ))}
        </div>

        {error && <p className="alert-danger">{error}</p>}

        <div className="pay-coords-block">
          <p className="pay-coords-label">Vos coordonnées</p>
          <div className="pay-coords-fields">
            <input
              className="input-field"
              placeholder="Votre nom"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              aria-label="Votre nom"
            />
            <div className="phone-input-row">
              <span className="phone-prefix">+221</span>
              <input
                className="input-field phone-input"
                type="tel"
                placeholder="77 123 45 67"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                aria-label="Téléphone"
              />
            </div>
          </div>
        </div>
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
