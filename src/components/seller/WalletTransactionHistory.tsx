"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { adaptTransaction, type AdaptedTransaction } from "@/lib/api-adapters";

type TransactionItem = AdaptedTransaction;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WalletTransactionHistory({ refreshKey = 0 }: { refreshKey?: number }) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/orders/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions((data || []).map(adaptTransaction));
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
      <section className="wallet-txn-history">
        <h2 className="wallet-section-title">Mouvements</h2>
        <p className="text-muted wallet-txn-empty">Chargement…</p>
      </section>
    );
  }

  if (transactions.length === 0) {
    return (
      <section className="wallet-txn-history">
        <h2 className="wallet-section-title">Mouvements</h2>
        <p className="text-muted wallet-txn-empty">
          Aucun mouvement pour le moment. Paiements, libérations et retraits apparaîtront ici.
        </p>
      </section>
    );
  }

  return (
    <section className="wallet-txn-history">
      <h2 className="wallet-section-title">Mouvements</h2>
      <p className="wallet-section-desc text-muted">
        Historique de vos paiements, libérations, remboursements et retraits.
      </p>
      <div className="wallet-txn-list">
        {transactions.map((txn) => (
          <article key={txn.id} className="wallet-txn-item">
            <div className="wallet-txn-item-main">
              <p className="wallet-txn-item-label">{txn.label}</p>
              {txn.detail && (
                <p className="wallet-txn-item-detail text-muted">{txn.detail}</p>
              )}
              <p className="wallet-txn-item-date text-muted">{fmtDate(txn.createdAt)}</p>
            </div>
            <span
              className={`wallet-txn-amount wallet-txn-amount--${txn.direction === "credit" ? "in" : "out"}`}
            >
              {txn.signedAmount > 0 ? "+" : txn.signedAmount < 0 ? "−" : ""}
              {formatCurrency(Math.abs(txn.signedAmount))}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
