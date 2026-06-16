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

export function WalletPayoutHistory({ refreshKey = 0 }: { refreshKey?: number }) {
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <section className="wallet-payout-history">
        <h2 className="wallet-section-title">Historique des retraits</h2>
        <p className="text-muted wallet-payout-empty">Chargement…</p>
      </section>
    );
  }

  if (payouts.length === 0) {
    return (
      <section className="wallet-payout-history">
        <h2 className="wallet-section-title">Historique des retraits</h2>
        <p className="text-muted wallet-payout-empty">
          Aucun retrait pour le moment. Vos retraits Wave et Orange Money apparaîtront ici.
        </p>
      </section>
    );
  }

  return (
    <section className="wallet-payout-history">
      <h2 className="wallet-section-title">Historique des retraits</h2>
      <div className="wallet-payout-list">
        {payouts.map((payout) => (
          <article key={payout.id} className="wallet-payout-item">
            <div className="wallet-payout-item-main">
              <p className="wallet-payout-item-amount">
                {formatCurrency(payout.netAmount ?? payout.amount)}
              </p>
              <p className="wallet-payout-item-meta text-muted">
                {METHOD_LABELS[payout.method]} · +221 {payout.phone}
              </p>
              <p className="wallet-payout-item-date text-muted">{fmtDate(payout.createdAt)}</p>
            </div>
            <span className={`wallet-payout-status wallet-payout-status--${payout.status}`}>
              {STATUS_LABELS[payout.status]}
            </span>
            {payout.status === "failed" && payout.failureReason && (
              <p className="wallet-payout-failure">{payout.failureReason}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
