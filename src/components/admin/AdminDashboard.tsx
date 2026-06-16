"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";

type Tab = "overview" | "vendors" | "orders" | "payouts";

interface OverviewData {
  stats: {
    sellerCount: number;
    productCount: number;
    orderCount: number;
    paidTodayCount: number;
    gmvToday: number;
    openDisputes: number;
    pendingPayouts: number;
    failedPayouts: number;
    totalAvailable: number;
    totalEscrow: number;
  };
  health: {
    commit: string | null;
    payoutConfigured: boolean;
    storage: string;
    remoteOk?: boolean;
  };
}

interface VendorRow {
  id: string;
  username: string;
  displayName: string;
  businessName: string;
  emailVerified: boolean;
  available: number;
  escrow: number;
  orderCount: number;
  productCount: number;
  disputeCount: number;
  createdAt: string;
}

interface OrderRow {
  id: string;
  slug: string;
  sellerUsername: string;
  sellerName: string;
  productName: string;
  clientName: string;
  clientPhone: string;
  status: OrderStatus;
  total: number;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  disputeReason?: string;
}

interface PayoutRow {
  id: string;
  sellerUsername: string;
  sellerName: string;
  amount: number;
  method: string;
  phone: string;
  status: string;
  failureReason?: string;
  createdAt: string;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "vendors", label: "Vendeurs" },
  { id: "orders", label: "Commandes" },
  { id: "payouts", label: "Retraits" },
];

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status: string) {
  if (status === "failed" || status === "dispute" || status === "refunded") return "bad";
  if (status === "success" || status === "released") return "good";
  if (status === "pending" || status === "processing" || status === "paid") return "warn";
  return "neutral";
}

export function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [orderFilter, setOrderFilter] = useState<"all" | OrderStatus>("all");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);

  const loadAll = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const [overviewRes, vendorsRes, ordersRes, payoutsRes] = await Promise.all([
        fetch("/api/admin/overview"),
        fetch("/api/admin/vendors"),
        fetch("/api/admin/orders"),
        fetch("/api/admin/payouts"),
      ]);

      if (overviewRes.status === 401) {
        router.replace("/auth?redirect=/admin");
        return;
      }
      if (overviewRes.status === 403) {
        router.replace("/dashboard");
        return;
      }
      if (!overviewRes.ok) throw new Error("Impossible de charger l'admin");

      setOverview(await overviewRes.json());
      if (vendorsRes.ok) setVendors((await vendorsRes.json()).vendors || []);
      if (ordersRes.ok) setOrders((await ordersRes.json()).orders || []);
      if (payoutsRes.ok) setPayouts((await payoutsRes.json()).payouts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur admin");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === "all") return orders;
    return orders.filter((order) => order.status === orderFilter);
  }, [orders, orderFilter]);

  const retryPayout = async (payoutId: string) => {
    setRetryingId(payoutId);
    setError("");
    const res = await fetch(`/api/admin/payouts/${payoutId}/retry`, { method: "POST" });
    const data = await res.json();
    setRetryingId(null);
    if (!res.ok) {
      setError(data.error || "Relance impossible");
      return;
    }
    await loadAll();
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <nav className="admin-tabs" aria-label="Sections admin">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`admin-tab ${tab === item.id ? "is-active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
        <button type="button" className="admin-refresh" onClick={loadAll}>
          Actualiser
        </button>
      </nav>

      {error && <p className="admin-error">{error}</p>}

      {tab === "overview" && overview && (
        <section className="admin-section">
          <div className="admin-kpi-grid">
            <article className="admin-kpi">
              <p className="admin-kpi-label">GMV aujourd&apos;hui</p>
              <p className="admin-kpi-value">{formatCurrency(overview.stats.gmvToday)}</p>
              <p className="admin-kpi-sub">{overview.stats.paidTodayCount} commande(s)</p>
            </article>
            <article className="admin-kpi">
              <p className="admin-kpi-label">Vendeurs actifs</p>
              <p className="admin-kpi-value">{overview.stats.sellerCount}</p>
              <p className="admin-kpi-sub">{overview.stats.productCount} produits</p>
            </article>
            <article className="admin-kpi">
              <p className="admin-kpi-label">Litiges ouverts</p>
              <p className="admin-kpi-value">{overview.stats.openDisputes}</p>
              <p className="admin-kpi-sub">{overview.stats.orderCount} commandes totales</p>
            </article>
            <article className="admin-kpi">
              <p className="admin-kpi-label">Retraits</p>
              <p className="admin-kpi-value">{overview.stats.pendingPayouts} en cours</p>
              <p className="admin-kpi-sub">{overview.stats.failedPayouts} échoué(s)</p>
            </article>
            <article className="admin-kpi">
              <p className="admin-kpi-label">Soldes plateforme</p>
              <p className="admin-kpi-value">{formatCurrency(overview.stats.totalAvailable)}</p>
              <p className="admin-kpi-sub">
                {formatCurrency(overview.stats.totalEscrow)} en séquestre
              </p>
            </article>
          </div>

          <article className="admin-card">
            <h2 className="admin-card-title">Santé système</h2>
            <ul className="admin-health-list">
              <li>
                <span>Déploiement</span>
                <strong>{overview.health.commit || "local"}</strong>
              </li>
              <li>
                <span>Stockage</span>
                <strong>{overview.health.storage}</strong>
              </li>
              <li>
                <span>Supabase</span>
                <strong>{overview.health.remoteOk ? "OK" : "Erreur"}</strong>
              </li>
              <li>
                <span>Payout Bictorys</span>
                <strong>{overview.health.payoutConfigured ? "Configuré" : "Manquant"}</strong>
              </li>
            </ul>
          </article>
        </section>
      )}

      {tab === "vendors" && (
        <section className="admin-section">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vendeur</th>
                  <th>Tag</th>
                  <th>Disponible</th>
                  <th>Séquestre</th>
                  <th>Commandes</th>
                  <th>Litiges</th>
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Aucun vendeur</td>
                  </tr>
                ) : (
                  vendors.map((vendor) => (
                    <tr key={vendor.id}>
                      <td>
                        <strong>{vendor.displayName}</strong>
                        <span className="admin-cell-sub">{vendor.businessName}</span>
                      </td>
                      <td>
                        @{vendor.username}
                        {!vendor.emailVerified && (
                          <span className="admin-badge bad">Email non vérifié</span>
                        )}
                      </td>
                      <td>{formatCurrency(vendor.available)}</td>
                      <td>{formatCurrency(vendor.escrow)}</td>
                      <td>{vendor.orderCount}</td>
                      <td>{vendor.disputeCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "orders" && (
        <section className="admin-section">
          <div className="admin-filters">
            {(["all", "paid", "protection", "released", "dispute", "refunded", "pending_payment"] as const).map(
              (key) => (
                <button
                  key={key}
                  type="button"
                  className={`admin-filter ${orderFilter === key ? "is-active" : ""}`}
                  onClick={() => setOrderFilter(key)}
                >
                  {key === "all" ? "Toutes" : ORDER_STATUS_LABELS[key]}
                </button>
              )
            )}
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Vendeur</th>
                  <th>Client</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Aucune commande</td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="admin-row-click" onClick={() => setSelectedOrder(order)}>
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
                        <span className={`admin-badge ${statusClass(order.status)}`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td>{formatDate(order.paidAt || order.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "payouts" && (
        <section className="admin-section">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vendeur</th>
                  <th>Montant</th>
                  <th>Méthode</th>
                  <th>Téléphone</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={7}>Aucun retrait</td>
                  </tr>
                ) : (
                  payouts.map((payout) => (
                    <tr key={payout.id}>
                      <td>
                        <strong>{payout.sellerName}</strong>
                        <span className="admin-cell-sub">@{payout.sellerUsername}</span>
                      </td>
                      <td>{formatCurrency(payout.amount)}</td>
                      <td>{payout.method}</td>
                      <td>{payout.phone}</td>
                      <td>
                        <span className={`admin-badge ${statusClass(payout.status)}`}>
                          {payout.status}
                        </span>
                        {payout.failureReason && (
                          <span className="admin-cell-sub">{payout.failureReason}</span>
                        )}
                      </td>
                      <td>{formatDate(payout.createdAt)}</td>
                      <td>
                        {payout.status === "failed" ? (
                          <button
                            type="button"
                            className="admin-action-btn"
                            disabled={retryingId === payout.id}
                            onClick={() => retryPayout(payout.id)}
                          >
                            {retryingId === payout.id ? "…" : "Relancer"}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <article className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <header className="admin-modal-head">
              <h2>Commande {selectedOrder.slug}</h2>
              <button type="button" className="admin-modal-close" onClick={() => setSelectedOrder(null)}>
                ×
              </button>
            </header>
            <dl className="admin-detail-list">
              <div>
                <dt>Produit</dt>
                <dd>{selectedOrder.productName}</dd>
              </div>
              <div>
                <dt>Vendeur</dt>
                <dd>
                  {selectedOrder.sellerName} (@{selectedOrder.sellerUsername})
                </dd>
              </div>
              <div>
                <dt>Client</dt>
                <dd>
                  {selectedOrder.clientName} — {selectedOrder.clientPhone}
                </dd>
              </div>
              <div>
                <dt>Montant</dt>
                <dd>{formatCurrency(selectedOrder.total)}</dd>
              </div>
              <div>
                <dt>Statut</dt>
                <dd>{ORDER_STATUS_LABELS[selectedOrder.status]}</dd>
              </div>
              <div>
                <dt>Paiement</dt>
                <dd>{selectedOrder.paymentMethod || "—"}</dd>
              </div>
              <div>
                <dt>Créée</dt>
                <dd>{formatDate(selectedOrder.createdAt)}</dd>
              </div>
              {selectedOrder.disputeReason && (
                <div>
                  <dt>Litige</dt>
                  <dd>{selectedOrder.disputeReason}</dd>
                </div>
              )}
            </dl>
          </article>
        </div>
      )}
    </div>
  );
}
