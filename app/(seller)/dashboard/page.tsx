"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order } from "@/lib/types";
import { computeWalletBreakdown } from "@/lib/wallet-breakdown";
import { computeChargebackStats } from "@/lib/chargeback";
import { SellerOnboarding } from "@/components/seller/SellerOnboarding";
import { ActionRequiredCard } from "@/components/seller/ActionRequiredCard";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { WalletOverview } from "@/components/seller/WalletOverview";
import { AssetRow } from "@/components/seller/AssetRow";
import { OrderQuickView } from "@/components/seller/OrderQuickView";
import { buildShopUrl } from "@/lib/site-url";
import { useSellerData } from "@/components/seller/SellerDataProvider";

const ORDERS_PREVIEW = 3;

export default function DashboardPage() {
  const { data, loading, refresh } = useSellerData();
  const [productCount, setProductCount] = useState(0);
  const [error, setError] = useState("");
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelWarning, setCancelWarning] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then(async (res) => {
        if (res.ok) {
          const p = await res.json();
          setProductCount((p.products || []).length);
        }
      })
      .catch(() => {});
  }, []);

  const validateDelivery = async (orderId: string, pin: string) => {
    setError("");
    const res = await fetch("/api/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, pin }),
    });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Validation impossible");
      return;
    }
    await refresh({ silent: true });
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    setError("");
    setCancelWarning("");
    const res = await fetch("/api/orders/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason }),
    });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Annulation impossible");
      return;
    }
    if (result.warning) {
      setCancelWarning(result.warning);
      setTimeout(() => setCancelWarning(""), 8000);
    }
    setSelectedOrder(null);
    await refresh({ silent: true });
  };

  if (loading && !data) return <DashboardSkeleton />;

  if (!data) {
    return (
      <div className="seller-dashboard seller-dashboard-empty">
        <p className="text-muted">Profil introuvable</p>
        <Link href="/auth" className="btn-seller-primary">
          Connexion
        </Link>
      </div>
    );
  }

  const breakdown = computeWalletBreakdown({
    available: data.wallet.available,
    sequestered: data.wallet.sequestered.map((s) => ({
      ...s,
      clientName: "",
      status: s.status as Order["status"],
    })),
  });

  const releasing = data.wallet.sequestered
    .filter((s) => s.status === "protection" && s.protectionEndsAt)
    .sort(
      (a, b) =>
        new Date(a.protectionEndsAt!).getTime() - new Date(b.protectionEndsAt!).getTime()
    )[0];

  const actionOrder = data.orders.find((o) => o.status === "paid");
  const visibleOrders = showAllOrders
    ? data.orders
    : data.orders.slice(0, ORDERS_PREVIEW);
  const hasMore = data.orders.length > ORDERS_PREVIEW;
  const hasValidatedDelivery = data.orders.some(
    (o) => o.status === "protection" || o.status === "released"
  );
  const shopUrl = buildShopUrl(data.profile.username);
  const showEmpty = data.orders.length === 0 && productCount === 0;

  // Chargeback stats
  const cbStats = computeChargebackStats(data.orders);

  return (
    <div className="seller-dashboard">
      <WalletOverview
        breakdown={breakdown}
        shopUrl={shopUrl}
        username={data.profile.username}
        actionSlot={
          actionOrder ? (
            <div id="pin-action">
              <ActionRequiredCard
                order={actionOrder}
                onValidate={validateDelivery}
                onCancel={cancelOrder}
                error={error}
              />
            </div>
          ) : undefined
        }
        releasing={
          releasing?.protectionEndsAt
            ? {
                protectionEndsAt: releasing.protectionEndsAt,
                productName: releasing.productName,
              }
            : undefined
        }
        protectionMinutes={data.protectionMinutes}
        onCountdownExpire={() => refresh({ silent: true })}
      />

      {/* Alerte chargeback */}
      {cbStats.level !== "ok" && (
        <div
          className={`chargeback-alert chargeback-alert--${cbStats.level} animate-fade-up`}
        >
          <p className="chargeback-alert-title">
            {cbStats.level === "danger"
              ? "⚠️ Taux de remboursement élevé"
              : "📊 Taux de remboursement à surveiller"}
          </p>
          <p className="chargeback-alert-desc">
            {cbStats.chargebacks} remboursement(s) sur {cbStats.totalPaid} commande(s) —{" "}
            <strong>{cbStats.rate}%</strong>
            {cbStats.level === "danger"
              ? ". Un hold de 48h sera appliqué sur vos prochains retraits. Assurez-vous de livrer chaque commande."
              : ". Attention à ne pas dépasser 10% pour éviter les restrictions."}
          </p>
        </div>
      )}

      {/* Alerte annulation */}
      {cancelWarning && (
        <p className="alert-danger animate-fade-up" style={{ margin: "0.75rem 0", fontSize: "0.85rem" }}>
          {cancelWarning}
        </p>
      )}

      <SellerOnboarding
        productCount={productCount}
        orderCount={data.orders.length}
        hasValidatedDelivery={hasValidatedDelivery}
      />

      {showEmpty ? (
        <section className="seller-tip-card animate-fade-up-d2">
          <p className="seller-tip-title">Lancez votre boutique</p>
          <p className="seller-tip-desc">
            Ajoutez un produit, copiez votre lien de paiement sécurisé et envoyez-le à vos clients.
          </p>
          <Link href="/create" className="btn-seller-primary">
            + Premier produit
          </Link>
        </section>
      ) : (
        <section className="seller-assets animate-fade-up-d2">
          <div className="seller-assets-head">
            <h2 className="seller-section-title">Commandes</h2>
            <span className="seller-assets-count">{data.orders.length}</span>
          </div>
          <div className="asset-list">
            {data.orders.length === 0 ? (
              <p className="text-muted">Aucune commande</p>
            ) : (
              <>
                {visibleOrders.map((order) => (
                  <AssetRow
                    key={order.id}
                    title={order.productName}
                    subtitle={order.clientName || "Client"}
                    amount={order.productPrice}
                    status={order.status}
                    onClick={() => setSelectedOrder(order)}
                  />
                ))}
                {hasMore && !showAllOrders && (
                  <button
                    type="button"
                    className="asset-list-see-more"
                    onClick={() => setShowAllOrders(true)}
                  >
                    Voir toutes les commandes ({data.orders.length})
                  </button>
                )}
                {showAllOrders && data.orders.length > ORDERS_PREVIEW && (
                  <button
                    type="button"
                    className="asset-list-see-more"
                    onClick={() => setShowAllOrders(false)}
                  >
                    Réduire
                  </button>
                )}
              </>
            )}
          </div>
          <Link href="/history" className="asset-list-history-link">
            Historique complet →
          </Link>
        </section>
      )}

      {/* Popup détail commande */}
      {selectedOrder && (
        <OrderQuickView
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
