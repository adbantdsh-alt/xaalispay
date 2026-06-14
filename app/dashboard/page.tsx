"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardNav } from "./DashboardNav";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import type { Order } from "@/lib/types";
import { formatCurrency, formatDeliveryHours } from "@/lib/utils";
import { computeWalletBreakdown } from "@/lib/wallet-breakdown";

interface DashboardData {
  profile: { username: string; displayName: string };
  wallet: {
    available: number;
    sequestered: Array<{
      orderId: string;
      productName: string;
      amount: number;
      status: string;
    }>;
  };
  orders: Order[];
  protectionMinutes: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({});
  const [validating, setValidating] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await fetch("/api/dashboard");
    if (res.status === 401) {
      window.location.href = "/auth";
      return;
    }
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const validateDelivery = async (orderId: string) => {
    setError("");
    setValidating(orderId);
    const res = await fetch("/api/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, pin: pinInputs[orderId] }),
    });
    const result = await res.json();
    setValidating(null);
    if (!res.ok) {
      setError(result.error || "Validation impossible");
      return;
    }
    setPinInputs((prev) => ({ ...prev, [orderId]: "" }));
    load();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  };

  if (loading) {
    return (
      <div className="page-shell-wide flex min-h-dvh items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#0FD5C7] border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-shell-wide p-8 text-center">
        <p>Profil vendeur introuvable. Complétez votre inscription.</p>
        <Link href="/auth" className="btn-primary mt-4 inline-flex">
          Retour auth
        </Link>
      </div>
    );
  }

  const breakdown = computeWalletBreakdown({
    available: data.wallet.available,
    sequestered: data.wallet.sequestered.map((s) => ({
      ...s,
      clientName: "",
      status: s.status as Order["status"],
    })),
  });

  return (
    <div className="page-shell-wide">
      <header className="flex items-start justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-[var(--muted)]">
            XaalisPay
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{data.profile.displayName}</h1>
          <p className="text-sm text-[var(--muted)]">
            @{data.profile.username} ·{" "}
            <Link href={`/${data.profile.username}`} className="text-[#0FD5C7]">
              Voir ma boutique →
            </Link>
          </p>
        </div>
        <button type="button" onClick={logout} className="btn-outline px-3 py-2 text-sm">
          Déconnexion
        </button>
      </header>

      <DashboardNav />

      <div className="card p-5">
        <p className="text-xs font-bold uppercase text-[var(--muted)]">Solde disponible</p>
        <p className="mt-1 text-3xl font-bold">{formatCurrency(breakdown.available)}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#e8ecf2] pt-4">
          <div className="rounded-xl bg-[#f5f7fb] p-3">
            <p className="text-[10px] font-semibold text-[var(--muted)]">Séquestre</p>
            <p className="mt-1 font-bold">{formatCurrency(breakdown.sequestered)}</p>
            <p className="text-[9px] text-[var(--muted)]">Avant livraison</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3">
            <p className="text-[10px] font-semibold text-amber-700">En remboursement</p>
            <p className="mt-1 font-bold text-amber-800">
              {formatCurrency(breakdown.pendingRefund)}
            </p>
            <p className="text-[9px] text-amber-700/70">Séquestre Flash {data.protectionMinutes} min</p>
          </div>
          <div className="rounded-xl bg-red-50 p-3">
            <p className="text-[10px] font-semibold text-red-500">Bloqué</p>
            <p className="mt-1 font-bold text-red-600">{formatCurrency(breakdown.blocked)}</p>
            <p className="text-[9px] text-red-500/70">Litige en cours</p>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <section className="mt-6 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--muted)]">
          Commandes reçues
        </h2>

        {data.orders.length === 0 ? (
          <div className="card p-8 text-center text-sm text-[var(--muted)]">
            Aucune commande pour le moment
          </div>
        ) : (
          data.orders.map((order) => (
            <article key={order.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{order.productName}</h3>
                  <p className="text-sm text-[var(--muted)]">{order.clientName || "Client"}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Délai livraison : {formatDeliveryHours(order.deliveryHours)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(order.productPrice)}</p>
                  <span className="badge badge-status mt-1">
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
              </div>

              {order.status === "paid" && (
                <div className="mt-4 space-y-2 border-t border-[#0F1F66]/8 pt-4">
                  <p className="text-xs text-[var(--muted)]">
                    Saisissez le code PIN donné par le client pour valider la livraison.
                  </p>
                  <div className="flex gap-2">
                    <input
                      className="input-field flex-1 font-mono tracking-widest"
                      placeholder="PIN"
                      maxLength={4}
                      value={pinInputs[order.id] || ""}
                      onChange={(e) =>
                        setPinInputs((prev) => ({
                          ...prev,
                          [order.id]: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => validateDelivery(order.id)}
                      disabled={validating === order.id}
                      className="btn-accent px-4"
                    >
                      {validating === order.id ? "..." : "Valider"}
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
