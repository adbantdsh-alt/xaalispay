"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";

const AUTO_REFRESH_MS = 15_000;

type Tab = "overview" | "vendors" | "orders" | "payouts" | "disputes";

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
    bictorysBaseUrl?: string;
    bictorysPayinKeySet?: boolean;
    bictorysRefundKeySet?: boolean;
    webhookSecretSet?: boolean;
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

interface DisputeMedia {
  type: "image" | "video";
  url: string;
  name?: string;
}

interface DisputeRow {
  id: string;
  slug: string;
  sellerId: string;
  sellerUsername: string;
  sellerName: string;
  sellerPhone: string | null;
  productName: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string | null;
  status: OrderStatus;
  total: number;
  buyerProtectionFee: number;
  paymentMethod?: string;
  paidAt?: string;
  clientDeliveryConfirmedAt?: string;
  disputeOpenedAt?: string;
  disputeReason: string;
  disputeMedia: DisputeMedia[];
  disputePhotos: string[];
  createdAt: string;
  updatedAt: string;
}

const TABS: { id: Tab; label: string; badge?: boolean }[] = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "vendors", label: "Vendeurs" },
  { id: "orders", label: "Commandes" },
  { id: "payouts", label: "Retraits" },
  { id: "disputes", label: "Litiges", badge: true },
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
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  };
  const [selectedDispute, setSelectedDispute] = useState<DisputeRow | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const refreshingRef = useRef(false);

  /** Charge silencieusement sans spinner plein écran. */
  const refreshData = useCallback(async (silent = false) => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    if (silent) setAutoRefreshing(true);
    else { setError(""); setLoading(true); }

    try {
      const noCache = { cache: "no-store" as const };
      const [overviewRes, vendorsRes, ordersRes, payoutsRes, disputesRes] = await Promise.all([
        fetch("/api/admin/overview", noCache),
        fetch("/api/admin/vendors", noCache),
        fetch("/api/admin/orders", noCache),
        fetch("/api/admin/payouts", noCache),
        fetch("/api/admin/disputes", noCache),
      ]);

      if (overviewRes.status === 401) { router.replace("/auth?redirect=/admin"); return; }
      if (overviewRes.status === 403) { router.replace("/dashboard"); return; }
      if (!overviewRes.ok) { if (!silent) setError("Impossible de charger l'admin"); return; }

      setOverview(await overviewRes.json());
      if (vendorsRes.ok) setVendors((await vendorsRes.json()).vendors || []);
      if (ordersRes.ok) setOrders((await ordersRes.json()).orders || []);
      if (payoutsRes.ok) setPayouts((await payoutsRes.json()).payouts || []);
      if (disputesRes.ok) {
        const freshDisputes = (await disputesRes.json()).disputes || [];
        setDisputes(freshDisputes);
        // Sync le litige sélectionné si toujours ouvert
        setSelectedDispute((prev) =>
          prev ? (freshDisputes.find((d: DisputeRow) => d.id === prev.id) ?? null) : null
        );
      }
      setLastUpdated(new Date());
    } catch {
      if (!silent) setError("Erreur de chargement");
    } finally {
      refreshingRef.current = false;
      if (silent) setAutoRefreshing(false);
      else setLoading(false);
    }
  }, [router]);

  const loadAll = useCallback(() => refreshData(false), [refreshData]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Auto-refresh silencieux toutes les 15 secondes
  useEffect(() => {
    const id = setInterval(() => refreshData(true), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [refreshData]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === "all") return orders;
    return orders.filter((order) => order.status === orderFilter);
  }, [orders, orderFilter]);

  const resolveDispute = async (disputeId: string, action: "refund" | "release", force = false) => {
    setResolving(disputeId + action);
    setError("");
    const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, force }),
    });
    const data = await res.json();
    setResolving(null);

    if (!res.ok) {
      // Commande déjà traitée → rafraîchir la liste pour nettoyer l'état
      if (res.status === 404) {
        const freshRes = await fetch("/api/admin/disputes");
        if (freshRes.ok) setDisputes((await freshRes.json()).disputes || []);
        showError("Cette commande a déjà été traitée — la liste a été mise à jour.");
        return;
      }
      if (data.canForce) {
        const confirmForce = window.confirm(
          `${data.error}\n\n` +
          `⚠️ AVANT DE CONFIRMER :\n` +
          `1. Connectez-vous au dashboard Bictorys\n` +
          `2. Vérifiez que la transaction est bien remboursée\n` +
          `3. Si oui, cliquez OK pour mettre à jour XaalisPay\n\n` +
          `Confirmer la mise à jour locale ?`
        );
        if (confirmForce) {
          await resolveDispute(disputeId, action, true);
        }
        return;
      }
      showError(data.error || "Action impossible");
      return;
    }

    if (data.warning) {
      showError(`⚠️ ${data.warning}`);
    }
    setDisputes(data.disputes || []);
    setSelectedDispute(null);
    // Rechargement de sécurité après 2s pour synchroniser l'état complet
    setTimeout(() => loadAll(), 2000);
  };

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
            {item.badge && disputes.length > 0 && (
              <span className="admin-tab-badge">{disputes.length}</span>
            )}
          </button>
        ))}
        <div className="admin-refresh-group">
          {lastUpdated && (
            <span className={`admin-last-updated ${autoRefreshing ? "admin-last-updated--syncing" : ""}`}>
              {autoRefreshing ? (
                <><span className="btn-spinner admin-sync-spinner" aria-hidden="true" />Sync…</>
              ) : (
                <>
                  <span className="admin-live-dot" aria-hidden="true" />
                  {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </>
              )}
            </span>
          )}
          <button type="button" className="admin-refresh" onClick={loadAll}>
            Actualiser
          </button>
        </div>
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
              <li>
                <span>API Bictorys</span>
                <strong
                  style={{
                    color: overview.health.bictorysBaseUrl?.includes("test") ? "#b91c1c" : "#15803d",
                    fontSize: "0.75rem",
                    wordBreak: "break-all",
                  }}
                >
                  {overview.health.bictorysBaseUrl?.includes("test") ? "⚠️ TEST — " : "✅ PROD — "}
                  {overview.health.bictorysBaseUrl}
                </strong>
              </li>
              <li>
                <span>Clé Payin</span>
                <strong style={{ color: overview.health.bictorysPayinKeySet ? "#15803d" : "#b91c1c" }}>
                  {overview.health.bictorysPayinKeySet ? "✅ Définie" : "❌ Manquante"}
                </strong>
              </li>
              <li>
                <span>Clé Remboursement</span>
                <strong style={{ color: overview.health.bictorysRefundKeySet ? "#15803d" : "#b91c1c" }}>
                  {overview.health.bictorysRefundKeySet ? "✅ Définie" : "❌ Manquante"}
                </strong>
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

      {tab === "disputes" && (
        <section className="admin-section">
          {disputes.length === 0 ? (
            <p className="admin-empty">Aucun litige ouvert.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Commande</th>
                    <th>Vendeur</th>
                    <th>Acheteur</th>
                    <th>Montant</th>
                    <th>Ouvert le</th>
                    <th>Raison</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <strong>{d.slug}</strong>
                        <span className="admin-cell-sub">{d.productName}</span>
                      </td>
                      <td>
                        @{d.sellerUsername}
                        {d.sellerPhone && (
                          <span className="admin-cell-sub">
                            <a href={`tel:${d.sellerPhone}`}>{d.sellerPhone}</a>
                          </span>
                        )}
                      </td>
                      <td>
                        {d.clientName}
                        <span className="admin-cell-sub">
                          <a href={`tel:${d.clientPhone}`}>{d.clientPhone}</a>
                        </span>
                      </td>
                      <td>{formatCurrency(d.total)}</td>
                      <td>{formatDate(d.disputeOpenedAt)}</td>
                      <td className="admin-dispute-reason">
                        {d.disputeReason
                          ? d.disputeReason.slice(0, 60) + (d.disputeReason.length > 60 ? "…" : "")
                          : <em>Non précisée</em>}
                        {d.disputeMedia.length > 0 && (
                          <span className="admin-badge warn">{d.disputeMedia.length} photo(s)</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-action-btn"
                          onClick={() => setSelectedDispute(d)}
                        >
                          Arbitrer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── Modal arbitrage litige ── */}
      {selectedDispute && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedDispute(null)}>
          <article className="admin-modal admin-modal--dispute" onClick={(e) => e.stopPropagation()}>
            <header className="admin-modal-head">
              <h2>Litige #{selectedDispute.slug}</h2>
              <button type="button" className="admin-modal-close" onClick={() => setSelectedDispute(null)}>×</button>
            </header>

            {/* Raison */}
            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Motif du litige</h3>
              <p className="admin-dispute-text">
                {selectedDispute.disputeReason || <em>Non précisé par l'acheteur</em>}
              </p>
            </div>

            {/* Médias */}
            {selectedDispute.disputeMedia.length > 0 && (
              <div className="admin-dispute-section">
                <h3 className="admin-dispute-section-title">
                  Preuves ({selectedDispute.disputeMedia.length} fichier{selectedDispute.disputeMedia.length > 1 ? "s" : ""})
                </h3>
                <div className="admin-media-grid">
                  {selectedDispute.disputeMedia.map((m, i) => (
                    m.type === "image" ? (
                      <button
                        key={i}
                        type="button"
                        className="admin-media-thumb"
                        onClick={() => setLightboxUrl(m.url)}
                        title="Agrandir"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.url} alt={m.name || `Photo ${i + 1}`} loading="lazy" />
                        <span className="admin-media-overlay">Voir</span>
                      </button>
                    ) : (
                      <a
                        key={i}
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-media-thumb admin-media-video"
                      >
                        <span>▶ Vidéo {i + 1}</span>
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Contacts */}
            <div className="admin-dispute-section admin-dispute-contacts">
              <div className="admin-contact-card">
                <p className="admin-contact-role">Acheteur</p>
                <p className="admin-contact-name">{selectedDispute.clientName}</p>
                <div className="admin-contact-actions">
                  <a href={`tel:${selectedDispute.clientPhone}`} className="admin-contact-btn admin-contact-call">
                    Appeler
                  </a>
                  <a
                    href={`https://wa.me/${selectedDispute.clientPhone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-contact-btn admin-contact-wa"
                  >
                    WhatsApp
                  </a>
                </div>
                {selectedDispute.clientAddress && (
                  <p className="admin-contact-sub">{selectedDispute.clientAddress}</p>
                )}
              </div>

              <div className="admin-contact-card">
                <p className="admin-contact-role">Vendeur</p>
                <p className="admin-contact-name">
                  {selectedDispute.sellerName}
                  <span className="admin-cell-sub"> @{selectedDispute.sellerUsername}</span>
                </p>
                {selectedDispute.sellerPhone ? (
                  <div className="admin-contact-actions">
                    <a href={`tel:${selectedDispute.sellerPhone}`} className="admin-contact-btn admin-contact-call">
                      Appeler
                    </a>
                    <a
                      href={`https://wa.me/${selectedDispute.sellerPhone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-contact-btn admin-contact-wa"
                    >
                      WhatsApp
                    </a>
                  </div>
                ) : (
                  <p className="admin-contact-sub">Téléphone non renseigné</p>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Chronologie</h3>
              <ol className="admin-timeline">
                <li>
                  <span className="admin-timeline-dot" />
                  <span className="admin-timeline-label">Commande créée</span>
                  <span className="admin-timeline-date">{formatDate(selectedDispute.createdAt)}</span>
                </li>
                {selectedDispute.paidAt && (
                  <li>
                    <span className="admin-timeline-dot admin-timeline-dot--ok" />
                    <span className="admin-timeline-label">Paiement confirmé ({selectedDispute.paymentMethod})</span>
                    <span className="admin-timeline-date">{formatDate(selectedDispute.paidAt)}</span>
                  </li>
                )}
                {selectedDispute.clientDeliveryConfirmedAt && (
                  <li>
                    <span className="admin-timeline-dot admin-timeline-dot--ok" />
                    <span className="admin-timeline-label">Réception confirmée par l'acheteur</span>
                    <span className="admin-timeline-date">{formatDate(selectedDispute.clientDeliveryConfirmedAt)}</span>
                  </li>
                )}
                {selectedDispute.disputeOpenedAt && (
                  <li>
                    <span className="admin-timeline-dot admin-timeline-dot--bad" />
                    <span className="admin-timeline-label">Litige ouvert</span>
                    <span className="admin-timeline-date">{formatDate(selectedDispute.disputeOpenedAt)}</span>
                  </li>
                )}
              </ol>
            </div>

            {/* Montants */}
            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Montants</h3>
              <dl className="admin-detail-list">
                <div><dt>Total commande</dt><dd>{formatCurrency(selectedDispute.total)}</dd></div>
                <div><dt>Frais protection acheteur</dt><dd>{formatCurrency(selectedDispute.buyerProtectionFee)}</dd></div>
              </dl>
            </div>

            {/* Actions arbitrage */}
            <div className="admin-dispute-section admin-arbitrage">
              <h3 className="admin-dispute-section-title">Décision arbitrage</h3>
              <p className="admin-arbitrage-warn">
                Cette action est irréversible. Vérifiez bien les preuves et contactez les parties avant de trancher.
              </p>
              <div className="admin-arbitrage-actions">
                <button
                  type="button"
                  className="admin-arbitrage-btn admin-arbitrage-refund"
                  disabled={resolving !== null}
                  onClick={() => resolveDispute(selectedDispute.id, "refund")}
                >
                  {resolving === selectedDispute.id + "refund" ? (
                    <><span className="btn-spinner" aria-hidden="true" />En cours…</>
                  ) : "Rembourser l'acheteur"}
                </button>
                <button
                  type="button"
                  className="admin-arbitrage-btn admin-arbitrage-release"
                  disabled={resolving !== null}
                  onClick={() => resolveDispute(selectedDispute.id, "release")}
                >
                  {resolving === selectedDispute.id + "release" ? (
                    <><span className="btn-spinner" aria-hidden="true" />En cours…</>
                  ) : "Libérer au vendeur"}
                </button>
              </div>
            </div>
          </article>
        </div>
      )}

      {/* Lightbox image */}
      {lightboxUrl && (
        <div className="admin-lightbox" onClick={() => setLightboxUrl(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="Preuve litige" onClick={(e) => e.stopPropagation()} />
          <button type="button" className="admin-lightbox-close" onClick={() => setLightboxUrl(null)}>×</button>
        </div>
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
