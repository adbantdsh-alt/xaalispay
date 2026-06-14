"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MOBILE_MONEY_METHODS } from "@/lib/payment-methods";
import { formatCurrency, formatDeliveryHours } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/types";

interface PayOrder {
  productName: string;
  productPrice: number;
  deliveryHours: number;
  status: string;
  slug: string;
  pin?: string;
  protectionEndsAt?: string;
  deliveryDeadlineAt?: string;
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
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    const res = await fetch(`/api/pay/${slug}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
      setProtectionMinutes(data.protectionMinutes || 30);
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
    const res = await fetch(`/api/pay/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dispute" }),
    });
    if (res.ok) fetchOrder();
  };

  if (loading) {
    return (
      <div className="page-shell flex min-h-dvh items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#0FD5C7] border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-shell flex min-h-dvh items-center justify-center">
        <div className="card p-8 text-center">
          <p className="text-[var(--muted)]">Lien de paiement invalide</p>
        </div>
      </div>
    );
  }

  if (order.status === "refunded") {
    return (
      <div className="page-shell flex min-h-dvh items-center justify-center">
        <div className="card p-8 text-center">
          <p className="text-3xl">↩️</p>
          <h2 className="mt-3 text-xl font-bold text-emerald-700">Remboursé</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Le vendeur n&apos;a pas validé la livraison à temps. Votre argent vous a été
            remboursé.
          </p>
        </div>
      </div>
    );
  }

  if (order.status === "released") {
    return (
      <div className="page-shell flex min-h-dvh items-center justify-center">
        <div className="card p-8 text-center">
          <p className="text-3xl">✓</p>
          <h2 className="mt-3 text-xl font-bold text-emerald-600">Transaction terminée</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Le paiement a été libéré au vendeur.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Link href={`/${order.seller.username}`} className="text-sm text-[var(--muted)]">
        ← @{order.seller.username}
      </Link>

      <div className="card mt-4 p-5">
        <p className="text-xs font-bold uppercase text-[var(--muted)]">Votre commande</p>
        <h1 className="mt-1 text-xl font-bold">{order.productName}</h1>
        <p className="mt-2 text-2xl font-bold">{formatCurrency(order.productPrice)}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Livraison sous {formatDeliveryHours(order.deliveryHours)} · Vendeur{" "}
          {order.seller.displayName}
        </p>
      </div>

      {!paid ? (
        <>
          <div className="card mt-4 space-y-3 p-5">
            <p className="text-sm font-semibold">Vos coordonnées (sans compte)</p>
            <input
              className="input-field"
              placeholder="Votre nom"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
            <input
              className="input-field"
              type="tel"
              placeholder="Votre téléphone"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
          </div>

          <div className="card mt-4 p-4">
            <p className="text-xs font-bold text-[#0FD5C7]">VOUS GARDEZ LE CONTRÔLE</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Votre argent est placé en séquestre. Le vendeur n&apos;est payé qu&apos;après
              livraison validée + {protectionMinutes} min sans litige. Pas de livraison dans
              le délai ? Remboursement automatique.
            </p>
          </div>

          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-4 space-y-2">
            {MOBILE_MONEY_METHODS.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => handlePay(method.id)}
                disabled={paying}
                className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl ${method.color} px-4 py-3 font-semibold text-white disabled:opacity-50`}
              >
                <span className="text-xl">{method.icon}</span>
                Payer via {method.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="card mt-4 p-5 text-center">
          <p className="text-3xl">✓</p>
          <h2 className="mt-2 text-xl font-bold">Paiement confirmé — séquestre actif</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Statut : {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
          </p>

          {pin && order.status === "paid" && (
            <>
              <div className="mt-5 rounded-2xl bg-[#0F1F66] p-5 text-white">
                <p className="text-sm opacity-80">Votre code PIN livraison</p>
                <p className="mt-2 font-mono text-3xl font-bold tracking-widest">{pin}</p>
              </div>
              <p className="mt-4 text-sm font-semibold">
                Donnez ce code uniquement après réception du colis.
              </p>
              {order.deliveryDeadlineAt && (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Si le vendeur ne valide pas avant la date limite, remboursement automatique.
                </p>
              )}
            </>
          )}

          {order.status === "protection" && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-[var(--muted)]">
                Séquestre Flash : {protectionMinutes} min pour signaler un problème.
              </p>
              <button
                type="button"
                onClick={handleDispute}
                className="btn-outline w-full border-red-200 text-red-600"
              >
                Ouvrir un litige
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
