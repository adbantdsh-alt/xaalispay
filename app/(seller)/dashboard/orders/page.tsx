"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useSellerData } from "@/components/seller/SellerDataProvider";
import { AssetRow } from "@/components/seller/AssetRow";
import { OrderDetailSheet } from "@/components/seller/OrderDetailSheet";
import { OrderFilterTabs } from "@/components/seller/OrderFilterTabs";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { filterOrders, type OrderFilterKey } from "@/lib/order-filters";
import { calculateSellerCommission } from "@/lib/fees";
import { getOrderTotal } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import type { Order } from "@/lib/types";

function OrdersContent() {
  const { data, loading, refresh } = useSellerData();
  const [orderFilter, setOrderFilter] = useState<OrderFilterKey>("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelWarning, setCancelWarning] = useState("");

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    let result = filterOrders(data.orders, orderFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (o) =>
          o.productName?.toLowerCase().includes(q) ||
          o.clientName?.toLowerCase().includes(q) ||
          o.clientFirstName?.toLowerCase().includes(q) ||
          o.orderNumber?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [data, orderFilter, search]);

  const cancelOrder = async (orderId: string, reason: string) => {
    const res = await apiFetch(`/api/orders/${orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    const result = await res.json();
    if (!res.ok) return;
    if (result.warning) {
      setCancelWarning(result.warning);
      setTimeout(() => setCancelWarning(""), 8000);
    }
    setSelectedOrder(null);
    await refresh({ silent: true });
  };

  if (loading && !data) return <DashboardSkeleton />;
  if (!data) return null;

  return (
    <div className="seller-dashboard">
      <div className="dashboard-orders-head" style={{ marginBottom: "1rem" }}>
        <Link
          href="/dashboard"
          className="btn-ghost"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", minHeight: "auto", padding: "0.25rem 0.5rem" }}
        >
          <ChevronLeft size={15} strokeWidth={1.5} /> Accueil
        </Link>
        <h1 className="dashboard-orders-title">Toutes les commandes</h1>
      </div>

      <label className="field-block" style={{ marginBottom: "0.75rem" }}>
        <input
          className="input-field"
          type="search"
          placeholder="Rechercher un produit, client, référence…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      <OrderFilterTabs filter={orderFilter} onFilterChange={setOrderFilter} />

      {cancelWarning && (
        <p className="alert-danger animate-fade-up" role="alert" style={{ margin: "0.75rem 0", fontSize: "0.85rem" }}>
          {cancelWarning}
        </p>
      )}

      <div className="asset-list">
        {filteredOrders.length === 0 ? (
          <p className="history-empty text-muted">Aucune commande trouvée.</p>
        ) : (
          filteredOrders.map((order) => {
            const gross = getOrderTotal(order);
            return (
              <AssetRow
                key={order.id}
                title={order.productName}
                subtitle={order.clientName || "Client"}
                amount={gross - calculateSellerCommission(gross)}
                status={order.status}
                imageUrl={order.productImage}
                onClick={() => setSelectedOrder(order)}
              />
            );
          })
        )}
      </div>

      {selectedOrder && (
        <OrderDetailSheet
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancel={
            selectedOrder.status === "pending_payment" || selectedOrder.status === "paid"
              ? cancelOrder
              : undefined
          }
        />
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <OrdersContent />
    </Suspense>
  );
}
