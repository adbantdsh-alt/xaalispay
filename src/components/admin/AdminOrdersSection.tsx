"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { adminStatusClass, formatAdminDate, type OrderRow } from "./admin-types";

const STATUS_TABS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "paid", label: ORDER_STATUS_LABELS.paid },
  { value: "protection", label: ORDER_STATUS_LABELS.protection },
  { value: "released", label: ORDER_STATUS_LABELS.released },
  { value: "dispute", label: ORDER_STATUS_LABELS.dispute },
  { value: "refunded", label: ORDER_STATUS_LABELS.refunded },
  { value: "cancelled", label: ORDER_STATUS_LABELS.cancelled },
];

export function AdminOrdersSection({
  orders,
  onDetailOpenChange,
}: {
  orders: OrderRow[];
  onDetailOpenChange?: (open: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);

  useEffect(() => {
    onDetailOpenChange?.(!!selectedOrder);
  }, [selectedOrder, onDetailOpenChange]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (status && o.status !== status) return false;
      if (!term) return true;
      return (
        o.orderNumber.toLowerCase().includes(term) ||
        o.clientName.toLowerCase().includes(term) ||
        o.clientPhone.includes(term) ||
        o.productName.toLowerCase().includes(term) ||
        o.sellerBusinessName.toLowerCase().includes(term) ||
        o.sellerUsername.toLowerCase().includes(term)
      );
    });
  }, [orders, search, status]);

  return (
    <>
      <section className="admin-section">
        <div className="admin-filters">
          <div className="admin-search-wrap">
            <Search size={16} aria-hidden="true" />
            <input
              className="input-field input-compact"
              placeholder="Rechercher une commande, un client, un vendeur…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value || "all"}
              type="button"
              className={`admin-filter ${status === tab.value ? "is-active" : ""}`}
              onClick={() => setStatus(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <p className="admin-empty">Aucune commande trouvée.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Vendeur</th>
                  <th>Acheteur</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.orderNumber}</strong>
                      <span className="admin-cell-sub">{o.productName}</span>
                    </td>
                    <td>
                      {o.sellerBusinessName}
                      <span className="admin-cell-sub admin-mono">@{o.sellerUsername}</span>
                    </td>
                    <td>
                      {o.clientName}
                      <span className="admin-cell-sub">
                        <a href={`tel:${o.clientPhone}`}>{o.clientPhone}</a>
                      </span>
                    </td>
                    <td className="admin-mono">{formatCurrency(o.total)}</td>
                    <td>
                      <span className={`admin-badge ${adminStatusClass(o.status)}`}>
                        {ORDER_STATUS_LABELS[o.status]}
                      </span>
                    </td>
                    <td>{formatAdminDate(o.createdAt)}</td>
                    <td>
                      <button type="button" className="admin-action-btn" onClick={() => setSelectedOrder(o)}>
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <article className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <header className="admin-modal-head">
              <div className="admin-modal-head-id">
                <div>
                  <div className="admin-modal-head-title">Commande {selectedOrder.orderNumber}</div>
                  <div className="admin-modal-head-subtitle">{selectedOrder.productName}</div>
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedOrder(null)}
                aria-label="Fermer"
              >
                ×
              </button>
            </header>

            <div className="admin-dispute-section">
              <span className={`admin-badge ${adminStatusClass(selectedOrder.status)}`}>
                {ORDER_STATUS_LABELS[selectedOrder.status]}
              </span>
            </div>

            <div className="admin-dispute-section admin-dispute-contacts">
              <div className="admin-contact-card">
                <p className="admin-contact-role">Acheteur</p>
                <p className="admin-contact-name">{selectedOrder.clientName}</p>
                <div className="admin-contact-actions">
                  <a href={`tel:${selectedOrder.clientPhone}`} className="admin-contact-btn admin-contact-call">
                    Appeler
                  </a>
                  <a
                    href={`https://wa.me/${selectedOrder.clientPhone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-contact-btn admin-contact-wa"
                  >
                    WhatsApp
                  </a>
                </div>
                {selectedOrder.clientAddress && (
                  <p className="admin-contact-sub">{selectedOrder.clientAddress}</p>
                )}
              </div>

              <div className="admin-contact-card">
                <p className="admin-contact-role">Vendeur</p>
                <p className="admin-contact-name">
                  {selectedOrder.sellerBusinessName}
                  <span className="admin-cell-sub"> @{selectedOrder.sellerUsername}</span>
                </p>
                {selectedOrder.sellerPhone ? (
                  <div className="admin-contact-actions">
                    <a href={`tel:${selectedOrder.sellerPhone}`} className="admin-contact-btn admin-contact-call">
                      Appeler
                    </a>
                    <a
                      href={`https://wa.me/${selectedOrder.sellerPhone.replace(/\D/g, "")}`}
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

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Montants</h3>
              <dl className="admin-detail-list">
                <div>
                  <dt>Total commande</dt>
                  <dd>{formatCurrency(selectedOrder.total)}</dd>
                </div>
                <div>
                  <dt>Frais protection acheteur</dt>
                  <dd>{formatCurrency(selectedOrder.buyerProtectionFee)}</dd>
                </div>
                {selectedOrder.sellerCommission !== null && (
                  <div>
                    <dt>Commission vendeur</dt>
                    <dd>{formatCurrency(selectedOrder.sellerCommission)}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Chronologie</h3>
              <ol className="admin-timeline">
                <li>
                  <span className="admin-timeline-dot" />
                  <span className="admin-timeline-label">Commande créée</span>
                  <span className="admin-timeline-date">{formatAdminDate(selectedOrder.createdAt)}</span>
                </li>
                {selectedOrder.paidAt && (
                  <li>
                    <span className="admin-timeline-dot admin-timeline-dot--ok" />
                    <span className="admin-timeline-label">
                      Paiement confirmé{selectedOrder.paymentMethod ? ` (${selectedOrder.paymentMethod})` : ""}
                    </span>
                    <span className="admin-timeline-date">{formatAdminDate(selectedOrder.paidAt)}</span>
                  </li>
                )}
                {selectedOrder.deliveryValidatedAt && (
                  <li>
                    <span className="admin-timeline-dot admin-timeline-dot--ok" />
                    <span className="admin-timeline-label">Réception confirmée par l&apos;acheteur</span>
                    <span className="admin-timeline-date">
                      {formatAdminDate(selectedOrder.deliveryValidatedAt)}
                    </span>
                  </li>
                )}
                {selectedOrder.dispute?.openedAt && (
                  <li>
                    <span className="admin-timeline-dot admin-timeline-dot--bad" />
                    <span className="admin-timeline-label">Litige ouvert</span>
                    <span className="admin-timeline-date">{formatAdminDate(selectedOrder.dispute.openedAt)}</span>
                  </li>
                )}
              </ol>
            </div>

            {selectedOrder.dispute && (
              <div className="admin-dispute-section">
                <h3 className="admin-dispute-section-title">{selectedOrder.dispute.disputeTypeLabel}</h3>
                <p className="admin-dispute-text">
                  {selectedOrder.dispute.reason || <em>Non précisé par l&apos;acheteur</em>}
                </p>
                <p className="admin-contact-sub">Voir l&apos;onglet Litiges pour arbitrer ce dossier.</p>
              </div>
            )}
          </article>
        </div>
      )}
    </>
  );
}
