"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Order } from "@/lib/types";
import { formatCurrency, getOrderTotal } from "@/lib/utils";
import { filterOrders, type OrderFilterKey } from "@/lib/order-filters";
import { computeWalletBreakdown } from "@/lib/wallet-breakdown";
import { computeChargebackStats } from "@/lib/chargeback";
import { SellerOnboarding } from "@/components/seller/SellerOnboarding";
import { ActionRequiredCard } from "@/components/seller/ActionRequiredCard";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { WalletOverview } from "@/components/seller/WalletOverview";
import { AssetRow } from "@/components/seller/AssetRow";
import { OrderFilterTabs } from "@/components/seller/OrderFilterTabs";
import { OrderDetailSheet } from "@/components/seller/OrderDetailSheet";
import { SellerStatsCard } from "@/components/seller/SellerStatsCard";
import { computeSellerStats } from "@/lib/seller-stats";
import { buildShopUrl, formatPublicUrl } from "@/lib/site-url";
import { useSellerData } from "@/components/seller/SellerDataProvider";
import { apiFetch } from "@/lib/api-client";

function DashboardContent() {
  const { data, loading, refresh } = useSellerData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [productCount, setProductCount] = useState(0);
  const [error, setError] = useState("");
  const [pinErrorOrderId, setPinErrorOrderId] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<OrderFilterKey>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelWarning, setCancelWarning] = useState("");
  const [showWelcome, setShowWelcome] = useState(searchParams.get("welcome") === "1");

  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      router.replace("/dashboard", { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    apiFetch("/api/catalog/products/")
      .then(async (res) => {
        if (res.ok) {
          const products = await res.json();
          setProductCount((products || []).length);
        }
      })
      .catch(() => {});
  }, []);

  const validateDelivery = async (orderId: string, pin: string) => {
    setError("");
    setPinErrorOrderId(null);
    const order = data?.orders.find((o) => o.id === orderId);
    if (!order) {
      setError("Commande introuvable");
      setPinErrorOrderId(orderId);
      return false;
    }
    const res = await apiFetch(`/api/orders/${order.slug}/confirm-delivery`, {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Validation impossible");
      setPinErrorOrderId(orderId);
      return false;
    }
    await refresh({ silent: true });
    return true;
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    setError("");
    setCancelWarning("");
    const res = await apiFetch(`/api/orders/${orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
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

  const actionOrders = data.orders.filter((o) => o.status === "paid");
  const paidOrders = data.orders.filter((o) => o.status !== "pending_payment");
  const totalSales = paidOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);
  const filteredOrders = filterOrders(data.orders, orderFilter);
  const hasValidatedDelivery = data.orders.some(
    (o) => o.status === "protection" || o.status === "released"
  );
  const shopUrl = buildShopUrl(data.profile.username);
  const showEmpty = data.orders.length === 0 && productCount === 0;

  // Chargeback stats
  const cbStats = computeChargebackStats(data.orders);
  const sellerStats = computeSellerStats(data.orders);

  return (
    <div className="seller-dashboard">
      {showWelcome && (
        <p className="alert-info animate-fade-up" style={{ margin: "0 0 0.75rem" }}>
          Votre boutique est en ligne sur <strong>{formatPublicUrl(shopUrl)}</strong>.{" "}
          <button
            type="button"
            onClick={() => setShowWelcome(false)}
            className="btn-ghost"
            style={{ marginLeft: "0.5rem", minHeight: "auto", padding: "0.25rem 0.5rem" }}
          >
            OK
          </button>
        </p>
      )}
      <WalletOverview
        breakdown={breakdown}
        shopUrl={shopUrl}
        username={data.profile.username}
        actionSlot={
          actionOrders.length > 0 ? (
            <div id="pin-action" className="action-cards-stack">
              {actionOrders.length > 1 && (
                <p className="action-cards-stack-label">
                  {actionOrders.length} livraisons à valider
                </p>
              )}
              {actionOrders.map((order) => (
                <ActionRequiredCard
                  key={order.id}
                  order={order}
                  onValidate={validateDelivery}
                  onCancel={cancelOrder}
                  error={pinErrorOrderId === order.id ? error : undefined}
                  protectionMinutes={data.protectionMinutes}
                />
              ))}
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
        <p className="alert-danger animate-fade-up" role="alert" style={{ margin: "0.75rem 0", fontSize: "0.85rem" }}>
          {cancelWarning}
        </p>
      )}

      <SellerStatsCard stats={sellerStats} />

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
        <section className="seller-assets dashboard-orders animate-fade-up-d2">
          <div className="dashboard-orders-head">
            <h2 className="seller-section-title">Commandes</h2>
            {data.orders.length > 0 && (
              <p className="dashboard-orders-summary text-muted">
                {paidOrders.length} vente{paidOrders.length !== 1 ? "s" : ""}
                {totalSales > 0 ? ` · ${formatCurrency(totalSales)}` : ""}
              </p>
            )}
          </div>

          {data.orders.length > 0 && (
            <OrderFilterTabs
              orders={data.orders}
              filter={orderFilter}
              onFilterChange={setOrderFilter}
            />
          )}

          <div className="asset-list">
            {data.orders.length === 0 ? (
              <p className="text-muted">Aucune commande</p>
            ) : filteredOrders.length === 0 ? (
              <p className="history-empty text-muted">Aucune commande dans cette catégorie.</p>
            ) : (
              filteredOrders.map((order) => (
                <AssetRow
                  key={order.id}
                  title={order.productName}
                  subtitle={order.clientName || "Client"}
                  amount={getOrderTotal(order)}
                  status={order.status}
                  imageUrl={order.productImage}
                  onClick={() => setSelectedOrder(order)}
                />
              ))
            )}
          </div>
        </section>
      )}

      <SellerOnboarding
        productCount={productCount}
        orderCount={data.orders.length}
        hasValidatedDelivery={hasValidatedDelivery}
      />

      {/* Popup détail commande */}
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
