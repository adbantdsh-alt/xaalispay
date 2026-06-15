"use client";

import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { formatCurrency, getOrderTotal } from "@/lib/utils";
import { AssetRow } from "@/components/seller/AssetRow";
import { OrderDetailSheet } from "@/components/seller/OrderDetailSheet";

type FilterKey = "all" | "active" | "released" | "issue";

const FILTERS: { key: FilterKey; label: string; match: (s: OrderStatus) => boolean }[] = [
  { key: "all", label: "Toutes", match: () => true },
  { key: "active", label: "En cours", match: (s) => s === "paid" || s === "protection" },
  { key: "released", label: "Libérées", match: (s) => s === "released" },
  { key: "issue", label: "Litiges", match: (s) => s === "dispute" || s === "refunded" },
];

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = "/auth";
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const paidOrders = orders.filter((o) => o.status !== "pending_payment");
  const totalSales = paidOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);

  const activeFilter = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const visibleOrders = orders.filter((o) => activeFilter.match(o.status));

  return (
    <div className="seller-dashboard history-page">
      <header className="history-page-head">
        <h1 className="shop-page-title">Historique</h1>
        <p className="shop-page-sub text-muted">
          {paidOrders.length} vente{paidOrders.length !== 1 ? "s" : ""}
          {totalSales > 0 ? ` · ${formatCurrency(totalSales)}` : ""}
        </p>
      </header>

      {orders.length === 0 ? (
        <section className="seller-tip-card">
          <p className="seller-tip-title">Aucune transaction</p>
          <p className="seller-tip-desc">
            Vos ventes et commandes apparaîtront ici dès qu&apos;un client paie.
          </p>
        </section>
      ) : (
        <section className="history-page-list">
          <div className="history-filters" role="tablist" aria-label="Filtrer les commandes">
            {FILTERS.map((f) => {
              const count = orders.filter((o) => f.match(o.status)).length;
              return (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  className={`history-filter ${filter === f.key ? "is-active" : ""}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                  <span className="history-filter-count">{count}</span>
                </button>
              );
            })}
          </div>

          {visibleOrders.length === 0 ? (
            <p className="history-empty text-muted">Aucune commande dans cette catégorie.</p>
          ) : (
            <div className="asset-list">
              {visibleOrders.map((order) => (
                <AssetRow
                  key={order.id}
                  title={order.productName}
                  subtitle={order.clientName || order.clientPhone || "Client"}
                  amount={getOrderTotal(order)}
                  status={order.status}
                  onClick={() => setSelected(order)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <OrderDetailSheet order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
