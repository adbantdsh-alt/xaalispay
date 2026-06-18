"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface TransactionItem {
  id: string;
  label: string;
  detail?: string;
  signedAmount: number;
  direction: "credit" | "debit";
  createdAt: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface WalletTransactionHistoryProps {
  refreshKey?: number;
  transactions?: TransactionItem[];
  externalLoading?: boolean;
}

export function WalletTransactionHistory({
  refreshKey = 0,
  transactions: externalTransactions,
  externalLoading,
}: WalletTransactionHistoryProps) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(externalTransactions === undefined);

  const load = useCallback(async () => {
    if (externalTransactions !== undefined) return;
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } finally {
      setLoading(false);
    }
  }, [externalTransactions]);

  useEffect(() => {
    if (externalTransactions !== undefined) return;
    load();
  }, [load, refreshKey, externalTransactions]);

  const items = externalTransactions ?? transactions;
  const isLoading = externalLoading ?? loading;

  if (isLoading) {
    return (
      <section className="wallet-txn-history">
        <h2 className="wallet-section-title">Mouvements</h2>
        <p className="text-muted wallet-txn-empty">Chargement…</p>
      </section>
    );
  }

  if (items.length === 0) {
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
        {items.map((txn) => (
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
