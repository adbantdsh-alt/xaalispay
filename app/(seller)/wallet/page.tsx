"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { computeWalletBreakdown } from "@/lib/wallet-breakdown";
import { MOBILE_MONEY_METHODS } from "@/lib/payment-methods";
import { formatCurrency } from "@/lib/utils";
import { PayMethodLogo } from "@/components/ui/PayMethodLogo";
import type { Order } from "@/lib/types";

interface WalletPageData {
  wallet: {
    available: number;
    sequestered: Array<{
      orderId: string;
      productName: string;
      amount: number;
      status: string;
    }>;
  };
}

export default function WalletPage() {
  const [data, setData] = useState<WalletPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    const res = await fetch("/api/dashboard");
    if (res.status === 401) {
      window.location.href = "/auth";
      return;
    }
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleWithdraw = async (method: string) => {
    setError("");
    setSuccess("");
    setWithdrawing(true);

    const res = await fetch("/api/wallet/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(amount),
        method,
        phone,
      }),
    });

    const result = await res.json();
    setWithdrawing(false);

    if (!res.ok) {
      setError(result.error || "Retrait impossible");
      return;
    }

    setSuccess(result.message);
    setAmount("");
    load();
  };

  if (loading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="seller-dashboard seller-dashboard-empty">
        <p className="text-muted">Impossible de charger le portefeuille</p>
        <Link href="/dashboard" className="btn-seller-primary">Accueil</Link>
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
    <div className="seller-dashboard wallet-page">
      <header className="wallet-page-head">
        <h1 className="shop-page-title">Portefeuille</h1>
        <p className="shop-page-sub text-muted">Retirez vos fonds disponibles</p>
      </header>

      <section className="wallet-balance-card">
        <p className="wallet-balance-label">Solde disponible</p>
        <p className="wallet-balance-amount">{formatCurrency(breakdown.available)}</p>
        <div className="wallet-balance-grid">
          <div>
            <span className="wallet-balance-meta-label">En séquestre</span>
            <span className="wallet-balance-meta-value">{formatCurrency(breakdown.sequestered)}</span>
          </div>
          <div>
            <span className="wallet-balance-meta-label">Bientôt dispo.</span>
            <span className="wallet-balance-meta-value">{formatCurrency(breakdown.pendingRefund)}</span>
          </div>
        </div>
      </section>

      <section className="wallet-withdraw-card">
        <h2 className="wallet-section-title">Retirer vers mobile money</h2>
        <p className="wallet-section-desc text-muted">
          Transférez votre solde vers Wave ou Orange Money.
        </p>

        <label className="field-block">
          <span className="field-block-label">Montant (FCFA)</span>
          <input
            className="input-field input-compact"
            type="number"
            min={1}
            max={breakdown.available}
            placeholder="Ex. 10000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <label className="field-block">
          <span className="field-block-label">Numéro de réception</span>
          <div className="phone-input-row">
            <span className="phone-prefix">+221</span>
            <input
              className="input-field phone-input"
              type="tel"
              placeholder="77 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </label>

        <div className="wallet-withdraw-methods">
          {MOBILE_MONEY_METHODS.map((method) => (
            <button
              key={method.id}
              type="button"
              disabled={withdrawing || !amount || !phone}
              className={`pay-method ${method.btnClass} wallet-withdraw-btn`}
              onClick={() => handleWithdraw(method.id)}
            >
              <PayMethodLogo method={method.id} />
              <span>Retirer via {method.name}</span>
            </button>
          ))}
        </div>

        {error && <p className="alert-danger">{error}</p>}
        {success && <p className="toast-success" role="status">{success}</p>}
      </section>
    </div>
  );
}
