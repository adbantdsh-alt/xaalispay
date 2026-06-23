"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import { splitCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { adaptTransaction, type AdaptedTransaction } from "@/lib/api-adapters";

type TransactionItem = AdaptedTransaction;

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

export function WalletTransactionHistory({ refreshKey = 0 }: { refreshKey?: number }) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

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

  const visible = expanded ? transactions : transactions.slice(0, PREVIEW_COUNT);

  return (
    <section className="wallet-txn-history">
      <div className="wallet-section-head">
        <h2 className="wallet-section-title">Mouvements</h2>
        {transactions.length > PREVIEW_COUNT && !expanded && (
          <button type="button" className="wallet-section-see-all" onClick={() => setExpanded(true)}>
            Tout voir <ChevronRight size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>
      <div className="wallet-txn-list">
        {visible.map((txn) => (
          <article key={txn.id} className="wallet-txn-item">
            <span className={`wallet-txn-icon wallet-txn-icon--${txn.direction === "credit" ? "in" : "out"}`}>
              {txn.direction === "credit" ? (
                <ArrowDownLeft size={17} strokeWidth={1.5} />
              ) : (
                <ArrowUpRight size={17} strokeWidth={1.5} />
              )}
            </span>
            <div className="wallet-txn-item-main">
              <p className="wallet-txn-item-label">{txn.label}</p>
              <p className="wallet-txn-item-date text-muted">
                {txn.detail ? `${txn.detail} · ` : ""}
                {fmtDate(txn.createdAt)}
              </p>
            </div>
            <span
              className={`wallet-txn-amount wallet-txn-amount--${txn.direction === "credit" ? "in" : "out"}`}
            >
              {txn.signedAmount > 0 ? "+ " : txn.signedAmount < 0 ? "− " : ""}
              {splitCurrency(Math.abs(txn.signedAmount))[0]}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
