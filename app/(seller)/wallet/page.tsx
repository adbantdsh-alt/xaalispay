"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CountryCode } from "libphonenumber-js/max";
import { computeWalletBreakdown } from "@/lib/wallet-breakdown";
import { dialCodeFor, formatCurrency, formatPhoneDisplay, phonePlaceholderFor, splitCurrency, toE164 } from "@/lib/utils";
import { WalletPayoutMethodPicker } from "@/components/seller/WalletPayoutMethodPicker";
import { WalletPayoutHistory } from "@/components/seller/WalletPayoutHistory";
import { WalletTransactionHistory } from "@/components/seller/WalletTransactionHistory";
import { MOBILE_MONEY_LABELS, mobileMoneyMethodsForCountry, type MobileMoneyMethod } from "@/lib/payment-methods";
import type { Order } from "@/lib/types";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { useSellerData } from "@/components/seller/SellerDataProvider";
import { apiFetch } from "@/lib/api-client";

export default function WalletPage() {
  const { data, loading, refresh } = useSellerData();
  // Le pays du vendeur (Profile.country, immuable) — cast car le backend le
  // contraint déjà à un des codes réellement supportés (Country.choices).
  const country = (data?.profile?.country || "SN") as CountryCode;
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<MobileMoneyMethod>("wave");
  const [methodTouched, setMethodTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [payoutRefreshKey, setPayoutRefreshKey] = useState(0);
  const [txnRefreshKey, setTxnRefreshKey] = useState(0);

  useEffect(() => {
    if (data?.profile?.phone && !phoneTouched && !phone) {
      setPhone(formatPhoneDisplay(data.profile.phone, country));
    }
  }, [data?.profile?.phone, phone, phoneTouched, country]);

  // Le premier opérateur valide pour le pays du vendeur — évite qu'un
  // vendeur malien se retrouve avec "wave" présélectionné (pas activé au
  // Mali) tant qu'il n'a pas touché le sélecteur lui-même.
  useEffect(() => {
    if (methodTouched) return;
    const first = mobileMoneyMethodsForCountry(country)[0];
    if (first && first !== method) setMethod(first);
  }, [country, method, methodTouched]);

  const parsedAmount = Number(amount) || 0;

  const handleWithdraw = async () => {
    setError("");
    setSuccess("");
    setWithdrawing(true);

    const res = await apiFetch("/api/payouts/", {
      method: "POST",
      body: JSON.stringify({
        amount: Number(amount),
        // Bictorys exige un format E.164 strict ("+221771234567", sans
        // espace) — `phone` est en affichage local espacé ("77 123 45 67"),
        // jamais le format brut attendu par leur API.
        phone: toE164(phone, country),
        method,
      }),
    });

    const result = await res.json();
    setWithdrawing(false);

    if (!res.ok) {
      setError(result.error || "Retrait impossible");
      return;
    }

    setSuccess(
      result.warning
        ? `Retrait enregistré — ${result.warning}`
        : `Retrait enregistré. ${formatCurrency(result.net_amount ?? result.amount)} envoyés sur ${MOBILE_MONEY_LABELS[method]}.`
    );
    setAmount("");
    setPayoutRefreshKey((k) => k + 1);
    setTxnRefreshKey((k) => k + 1);
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
        <p className="wallet-balance-amount mono">
          {splitCurrency(breakdown.available)[0]}
          <span className="wallet-balance-amount-suffix">{splitCurrency(breakdown.available)[1]}</span>
        </p>
        <div className="wallet-balance-grid">
          <div>
            <span className="wallet-balance-meta-label">En séquestre</span>
            <span className="wallet-balance-meta-value mono">{splitCurrency(breakdown.sequestered)[0]}</span>
          </div>
          <div>
            <span className="wallet-balance-meta-label">Bloqué · litige</span>
            <span
              className={`wallet-balance-meta-value mono${breakdown.blocked > 0 ? " wallet-balance-meta-value-coral" : ""}`}
            >
              {splitCurrency(breakdown.blocked)[0]}
            </span>
          </div>
        </div>
      </section>

      <section className="wallet-withdraw-card">
        <p className="section-label">Retrait</p>
        <h2 className="wallet-section-title">Retirer vers mobile money</h2>
        <p className="wallet-section-desc text-muted">
          Retrait 100 % gratuit, sans frais déduit.
        </p>

        <label className="field-block">
          <span className="field-block-label">Montant</span>
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
            <span className="phone-prefix">{dialCodeFor(country)}</span>
            <input
              className="input-field phone-input"
              type="tel"
              placeholder={phonePlaceholderFor(country)}
              value={phone}
              onChange={(e) => {
                setPhoneTouched(true);
                setPhone(e.target.value);
              }}
            />
          </div>
        </label>

        <label className="field-block">
          <span className="field-block-label">Méthode</span>
          <WalletPayoutMethodPicker
            value={method}
            country={country}
            onChange={(m) => {
              setMethodTouched(true);
              setMethod(m);
            }}
          />
        </label>

        {parsedAmount > 0 && (
          <div className="wallet-fee-preview">
            <div className="wallet-fee-row wallet-fee-row-net">
              <span>Vous recevrez</span>
              <strong>{splitCurrency(parsedAmount)[0]} F</strong>
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn-primary wallet-withdraw-submit"
          disabled={!amount || !phone || withdrawing}
          onClick={handleWithdraw}
        >
          {withdrawing ? <span className="btn-spinner" aria-hidden="true" /> : "Confirmer le retrait"}
        </button>

        {error && <p className="alert-danger" role="alert">{error}</p>}
        {success && (
          <p className="toast-success" role="status">
            {success}
          </p>
        )}
      </section>

      <WalletTransactionHistory refreshKey={txnRefreshKey} />

      <WalletPayoutHistory refreshKey={payoutRefreshKey} />
    </div>
  );
}
