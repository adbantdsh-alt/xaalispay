"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, ClipboardList } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { formatAdminDate, type OrderRow } from "./admin-types";
import {
  ContactCard,
  DetailPanel,
  DetailSection,
  EmptyState,
  EntityCell,
  KeyValues,
  Panel,
  SearchField,
  StatStrip,
  StatusPill,
  Tabs,
  Timeline,
  toneForStatus,
} from "./AdminUI";

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

  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1;
    return counts;
  }, [orders]);

  const stats = useMemo(() => {
    const inEscrow = orders.filter((o) => o.status === "paid" || o.status === "protection");
    const paid = orders.filter((o) => ["paid", "protection", "released", "dispute"].includes(o.status));
    return {
      inEscrowCount: inEscrow.length,
      inEscrowAmount: inEscrow.reduce((sum, o) => sum + o.total, 0),
      paidAmount: paid.reduce((sum, o) => sum + o.total, 0),
    };
  }, [orders]);

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

  const tabs = STATUS_TABS.map((tab) => ({
    ...tab,
    count: tab.value ? countByStatus[tab.value] ?? 0 : orders.length,
  }));

  return (
    <>
      <section className="admin-section">
        <StatStrip
          items={[
            { label: "Commandes", value: orders.length, hint: "toutes, y compris non payées" },
            {
              label: "En séquestre",
              value: formatCurrency(stats.inEscrowAmount),
              hint: `${stats.inEscrowCount} commande(s) payées ou en protection`,
              tone: "accent",
            },
            {
              label: "En litige",
              value: countByStatus.dispute ?? 0,
              hint: "argent bloqué",
              tone: countByStatus.dispute ? "warn" : "default",
            },
            { label: "Volume payé", value: formatCurrency(stats.paidAmount), hint: "hors remboursées et annulées" },
          ]}
        />

        <Panel
          title="Commandes"
          count={filteredOrders.length}
          toolbar={
            <>
              <SearchField value={search} onChange={setSearch} placeholder="N° de commande, client, vendeur…" />
              <Tabs label="Filtrer par statut" options={tabs} value={status} onChange={setStatus} />
            </>
          }
        >
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Aucune commande"
              hint={search || status ? "Aucun résultat pour ces filtres." : "Les commandes apparaîtront ici."}
            />
          ) : (
            <table className="ax-table">
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Vendeur</th>
                  <th>Acheteur</th>
                  <th className="is-num">Montant</th>
                  <th>Statut</th>
                  <th>Créée le</th>
                  <th aria-label="Ouvrir" />
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="ax-row"
                    tabIndex={0}
                    onClick={() => setSelectedOrder(o)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedOrder(o)}
                  >
                    <td>
                      <span className="ax-cell-strong admin-mono">{o.orderNumber}</span>
                      <span className="ax-cell-sub">{o.productName}</span>
                    </td>
                    <td>
                      <EntityCell name={o.sellerBusinessName} sub={`@${o.sellerUsername}`} />
                    </td>
                    <td>
                      {o.clientName}
                      <span className="ax-cell-sub admin-mono">{o.clientPhone}</span>
                    </td>
                    <td className="is-num">{formatCurrency(o.total)}</td>
                    <td>
                      <StatusPill tone={toneForStatus(o.status)} label={ORDER_STATUS_LABELS[o.status]} />
                    </td>
                    <td className="is-nowrap is-muted">{formatAdminDate(o.createdAt)}</td>
                    <td className="ax-chevron">
                      <ChevronRight size={16} aria-hidden="true" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </section>

      {selectedOrder && (
        <DetailPanel
          title={`Commande ${selectedOrder.orderNumber}`}
          subtitle={selectedOrder.productName}
          badge={
            <StatusPill tone={toneForStatus(selectedOrder.status)} label={ORDER_STATUS_LABELS[selectedOrder.status]} />
          }
          onClose={() => setSelectedOrder(null)}
        >
          <div className="ax-summary">
            <div>
              <div className="ax-summary-label">Total commande</div>
              <div className="ax-summary-amount">{formatCurrency(selectedOrder.total)}</div>
            </div>
            <span className="ax-muted">Créée le {formatAdminDate(selectedOrder.createdAt)}</span>
          </div>

          <DetailSection title="Parties">
            <div className="ax-contacts">
              <ContactCard
                role="Acheteur"
                name={selectedOrder.clientName}
                phone={selectedOrder.clientPhone}
                sub={selectedOrder.clientAddress}
              />
              <ContactCard
                role={`Vendeur · @${selectedOrder.sellerUsername}`}
                name={selectedOrder.sellerBusinessName}
                phone={selectedOrder.sellerPhone}
              />
            </div>
          </DetailSection>

          <DetailSection title="Montants">
            <KeyValues
              rows={[
                { label: "Total commande", value: formatCurrency(selectedOrder.total) },
                { label: "Frais protection acheteur", value: formatCurrency(selectedOrder.buyerProtectionFee) },
                ...(selectedOrder.sellerCommission !== null
                  ? [{ label: "Commission vendeur", value: formatCurrency(selectedOrder.sellerCommission) }]
                  : []),
              ]}
            />
          </DetailSection>

          <DetailSection title="Chronologie">
            <Timeline
              items={[
                { label: "Commande créée", date: formatAdminDate(selectedOrder.createdAt) },
                ...(selectedOrder.paidAt
                  ? [
                      {
                        label: `Paiement confirmé${selectedOrder.paymentMethod ? ` (${selectedOrder.paymentMethod})` : ""}`,
                        date: formatAdminDate(selectedOrder.paidAt),
                        tone: "ok" as const,
                      },
                    ]
                  : []),
                ...(selectedOrder.deliveryValidatedAt
                  ? [
                      {
                        label: "Réception confirmée par l'acheteur",
                        date: formatAdminDate(selectedOrder.deliveryValidatedAt),
                        tone: "ok" as const,
                      },
                    ]
                  : []),
                ...(selectedOrder.dispute?.openedAt
                  ? [{ label: "Litige ouvert", date: formatAdminDate(selectedOrder.dispute.openedAt), tone: "bad" as const }]
                  : []),
              ]}
            />
          </DetailSection>

          {selectedOrder.dispute && (
            <DetailSection title={selectedOrder.dispute.disputeTypeLabel}>
              <p className="ax-callout">
                {selectedOrder.dispute.reason || "Motif non précisé par l'acheteur."} L&apos;arbitrage se fait
                depuis la page Litiges.
              </p>
            </DetailSection>
          )}
        </DetailPanel>
      )}
    </>
  );
}
