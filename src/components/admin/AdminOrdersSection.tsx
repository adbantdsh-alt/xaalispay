"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { adminStatusClass, formatAdminDate, type AdminOrderRow } from "./admin-types";

export function AdminOrdersSection({
  orders,
  busyId,
  onReconcile,
  onExpire,
  onRefresh,
}: {
  orders: AdminOrderRow[];
  busyId: string | null;
  onReconcile: (orderId: string) => Promise<void>;
  onExpire: (orderId: string) => Promise<void>;
  onRefresh: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "pending_payment" | "issue">("all");

  const filtered =
    filter === "all"
      ? orders
      : filter === "pending_payment"
        ? orders.filter((o) => o.status === "pending_payment")
        : orders.filter((o) =>
            ["dispute", "failed", "refunded", "cancelled"].includes(o.status) ||
            o.status === "pending_payment"
          );

  const pendingCount = orders.filter((o) => o.status === "pending_payment").length;

  return (
    <section className="admin-section">
      <header className="admin-section-head">
        <div>
          <h2 className="admin-card-title">Commandes</h2>
          <p className="admin-card-desc">
            {orders.length} commande(s) · {pendingCount} en attente de paiement
          </p>
        </div>
        <button type="button" className="admin-action-btn" onClick={onRefresh}>
          Actualiser
        </button>
      </header>

      <div className="admin-filter-row">
        {(
          [
            ["all", "Toutes"],
            ["pending_payment", "En attente"],
            ["issue", "À traiter"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`admin-filter-chip ${filter === key ? "is-active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Réf.</th>
              <th>Vendeur</th>
              <th>Client</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-empty">
                  Aucune commande
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.slug}</strong>
                    <span className="admin-cell-sub">{order.productName}</span>
                  </td>
                  <td>@{order.sellerUsername}</td>
                  <td>
                    {order.clientName}
                    <span className="admin-cell-sub">{order.clientPhone}</span>
                  </td>
                  <td>{formatCurrency(order.total)}</td>
                  <td>
                    <span className={`admin-badge ${adminStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="text-muted">{formatAdminDate(order.updatedAt)}</td>
                  <td className="admin-row-actions">
                    {order.status === "pending_payment" && (
                      <>
                        <button
                          type="button"
                          className="admin-action-btn"
                          disabled={busyId === order.id}
                          onClick={() => onReconcile(order.id)}
                        >
                          Réconcilier
                        </button>
                        <button
                          type="button"
                          className="admin-action-btn admin-action-btn--muted"
                          disabled={busyId === order.id}
                          onClick={() => onExpire(order.id)}
                        >
                          Expirer
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
