"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { computeWalletBreakdown } from "@/lib/wallet-breakdown";
import { calculatePayoutFee, getPayoutNetAmount, FEE_POLICY } from "@/lib/fees";
import { formatCurrency, formatSenegalPhoneDisplay } from "@/lib/utils";
import { PayMethodButtons } from "@/components/pay/PayMethodButtons";
import { WalletPayoutHistory } from "@/components/seller/WalletPayoutHistory";
import type { Order } from "@/lib/types";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { useSellerData } from "@/components/seller/SellerDataProvider";

export default function WalletPage() {
  const { data, loading, refresh } = useSellerData();
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [payoutRefreshKey, setPayoutRefreshKey] = useState(0);

  useEffect(() => {
    if (data?.profile?.phone && !phoneTouched && !phone) {
      setPhone(formatSenegalPhoneDisplay(data.profile.phone));
    }
  }, [data?.profile?.phone, phone, phoneTouched]);

  const parsedAmount = Number(amount) || 0;
  const withdrawPreview = useMemo(() => {
    if (parsedAmount <= 0) return null;
    return {
      fee: calculatePayoutFee(parsedAmount),
      net: getPayoutNetAmount(parsedAmount),
    };
  }, [parsedAmount]);

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
    setPayoutRefreshKey((k) => k + 1);
    await refresh({ silent: true });
  };

  if (loading && !data) return <DashboardSkeleton />;

  if (!data) {
    return (
      <div className="seller-dashboard seller-dashboard-empty">
        <p className="text-muted">Impossible de charger le portefeuille</p>
        <Link href="/dashboard" className="btn-seller-primary">
          Accueil
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
          {breakdown.blocked > 0 && (
            <div>
              <span className="wallet-balance-meta-label">Bloqué (litige)</span>
              <span className="wallet-balance-meta-value">{formatCurrency(breakdown.blocked)}</span>
            </div>
          )}
        </div>
      </section>

      <section className="wallet-withdraw-card">
        <h2 className="wallet-section-title">Retirer vers mobile money</h2>
        <p className="wallet-section-desc text-muted">
          Frais transparents : {FEE_POLICY.payout.shortLabel}. Le montant net est affiché avant
          confirmation.
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
              onChange={(e) => {
                setPhoneTouched(true);
                setPhone(e.target.value);
              }}
            />
          </div>
        </label>

        {withdrawPreview && parsedAmount > 0 && (
          <div className="wallet-fee-preview">
            <div className="wallet-fee-row">
              <span>Montant retiré du solde</span>
              <strong>{formatCurrency(parsedAmount)}</strong>
            </div>
            <div className="wallet-fee-row">
              <span>{FEE_POLICY.payout.label} ({FEE_POLICY.payout.shortLabel})</span>
              <strong>− {formatCurrency(withdrawPreview.fee)}</strong>
            </div>
            <div className="wallet-fee-row wallet-fee-row-net">
              <span>Vous recevez sur Wave/Orange</span>
              <strong>{formatCurrency(withdrawPreview.net)}</strong>
            </div>
          </div>
        )}

        <div className="wallet-withdraw-methods">
          <PayMethodButtons
            onPay={handleWithdraw}
            paying={withdrawing}
            disabled={!amount || !phone}
          />
        </div>

        {error && <p className="alert-danger">{error}</p>}
        {success && (
          <p className="toast-success" role="status">
            {success}
          </p>
        )}
      </section>

      <WalletPayoutHistory refreshKey={payoutRefreshKey} />
    </div>
  );
}
