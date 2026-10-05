"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { adaptPayout, type AdaptedPayout } from "@/lib/api-adapters";
import { MOBILE_MONEY_LABELS } from "@/lib/payment-methods";

type PayoutItem = AdaptedPayout;

const STATUS_LABELS: Record<PayoutItem["status"], string> = {
  pending: "En attente",
  processing: "En cours",
  success: "Reçu",
  failed: "Échoué",
};

const PREVIEW_COUNT = 3;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Même découpage preview/full que WalletTransactionHistory.
export function WalletPayoutHistory({
  refreshKey = 0,
  variant = "preview",
}: {
  refreshKey?: number;
  variant?: "preview" | "full";
}) {
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isPreview = variant === "preview";
  const title = isPreview ? <h2 className="wallet-section-title">Historique des retraits</h2> : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/payouts/mine");
      if (res.ok) {
        const data = await res.json();
        setPayouts((data || []).map(adaptPayout));
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
        {title}
        <p className="text-muted wallet-payout-empty">Chargement…</p>
      </section>
    );
  }

  if (payouts.length === 0) {
    return (
      <section className="wallet-payout-history">
        {title}
        <p className="text-muted wallet-payout-empty">
          Aucun retrait pour le moment. Vos retraits Wave et Orange Money apparaîtront ici.
        </p>
      </section>
    );
  }

  const visible = isPreview ? payouts.slice(0, PREVIEW_COUNT) : payouts;

  return (
    <section className="wallet-payout-history">
      {isPreview && (
        <div className="wallet-section-head">
          {title}
          {payouts.length > PREVIEW_COUNT && (
            <Link href="/wallet/payouts" className="wallet-section-see-all">
              Tout voir <ChevronRight size={14} strokeWidth={1.5} />
            </Link>
          )}
        </div>
      )}
      <div className="wallet-payout-list">
        {visible.map((payout) => (
          <article key={payout.id} className="wallet-payout-item">
            <div className="wallet-payout-item-main">
              <p className="wallet-payout-item-amount">
                {formatCurrency(payout.netAmount ?? payout.amount)}
              </p>
              <p className="wallet-payout-item-meta text-muted">
                {MOBILE_MONEY_LABELS[payout.method] || payout.method} · {payout.phone}
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
