"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/lib/types";
import { formatCurrency, getOrderTotal } from "@/lib/utils";
import { AssetRow } from "@/components/seller/AssetRow";
import { getSellerHumanStatus } from "@/lib/order-timeline";

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
          <p className="shop-section-label">Toutes les commandes</p>
          <div className="asset-list">
            {orders.map((order) => (
              <AssetRow
                key={order.id}
                title={order.productName}
                subtitle={order.clientName || order.clientPhone || "Client"}
                amount={getOrderTotal(order)}
                status={order.status}
              />
            ))}
          </div>

          <div className="history-legend">
            <p className="shop-section-label">Statuts</p>
            <ul className="history-legend-list text-muted">
              {(
                ["paid", "protection", "released", "dispute", "refunded", "pending_payment"] as const
              ).map((status) => (
                <li key={status}>{getSellerHumanStatus(status)}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
