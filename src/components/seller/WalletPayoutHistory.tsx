"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface PayoutItem {
  id: string;
  amount: number;
  netAmount?: number;
  fee?: number;
  method: "wave" | "orange";
  phone: string;
  status: "pending" | "processing" | "success" | "failed";
  failureReason?: string;
  createdAt: string;
}

const STATUS_LABELS: Record<PayoutItem["status"], string> = {
  pending: "En attente",
  processing: "En cours",
  success: "Reçu",
  failed: "Échoué",
};

const METHOD_LABELS = {
  wave: "Wave",
  orange: "Orange Money",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface WalletPayoutHistoryProps {
  refreshKey?: number;
  payouts?: PayoutItem[];
  externalLoading?: boolean;
}

export function WalletPayoutHistory({
  refreshKey = 0,
  payouts: externalPayouts,
  externalLoading,
}: WalletPayoutHistoryProps) {
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(externalPayouts === undefined);

  const load = useCallback(async () => {
    if (externalPayouts !== undefined) return;
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/payouts");
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts || []);
      }
    } finally {
      setLoading(false);
    }
  }, [externalPayouts]);

  useEffect(() => {
    if (externalPayouts !== undefined) return;
    load();
  }, [load, refreshKey, externalPayouts]);

  const items = externalPayouts ?? payouts;
  const isLoading = externalLoading ?? loading;

  if (isLoading) {
    return (
      <section className="wallet-payout-history">
        <h2 className="wallet-section-title">Retraits</h2>
        <p className="text-muted wallet-txn-empty">Chargement…</p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="wallet-payout-history">
        <h2 className="wallet-section-title">Retraits</h2>
        <p className="text-muted wallet-txn-empty">Aucun retrait pour le moment.</p>
      </section>
    );
  }

  return (
    <section className="wallet-payout-history">
      <h2 className="wallet-section-title">Retraits</h2>
      <div className="wallet-payout-list">
        {items.map((payout) => (
          <article key={payout.id} className="wallet-payout-item">
            <div className="wallet-payout-item-main">
              <p className="wallet-payout-item-amount">{formatCurrency(payout.amount)}</p>
              <p className="wallet-payout-item-meta text-muted">
                {METHOD_LABELS[payout.method]} · {payout.phone}
              </p>
              <p className="wallet-payout-item-date text-muted">{fmtDate(payout.createdAt)}</p>
              {payout.status === "failed" && payout.failureReason && (
                <p className="wallet-payout-item-error">{payout.failureReason}</p>
              )}
            </div>
            <span className={`wallet-payout-status wallet-payout-status--${payout.status}`}>
              {STATUS_LABELS[payout.status]}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
