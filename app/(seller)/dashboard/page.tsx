"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order } from "@/lib/types";
import { computeWalletBreakdown } from "@/lib/wallet-breakdown";
import { SellerOnboarding } from "@/components/seller/SellerOnboarding";
import { ActionRequiredCard } from "@/components/seller/ActionRequiredCard";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { WalletOverview } from "@/components/seller/WalletOverview";
import { AssetRow } from "@/components/seller/AssetRow";
import { buildShopUrl } from "@/lib/site-url";

interface DashboardData {
  profile: { username: string; displayName: string };
  wallet: {
    available: number;
    sequestered: Array<{
      orderId: string;
      productName: string;
      amount: number;
      status: string;
      protectionEndsAt?: string;
    }>;
  };
  orders: Order[];
  protectionMinutes: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    const [dashRes, prodRes] = await Promise.all([
      fetch("/api/dashboard"),
      fetch("/api/products"),
    ]);
    if (dashRes.status === 401) {
      window.location.href = "/auth";
      return;
    }
    if (dashRes.ok) setData(await dashRes.json());
    if (prodRes.ok) {
      const p = await prodRes.json();
      setProductCount((p.products || []).length);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
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
    load();
  };

  if (loading) return <DashboardSkeleton />;

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
  const recentOrders = data.orders.slice(0, 5);
  const hasValidatedDelivery = data.orders.some(
    (o) => o.status === "protection" || o.status === "released"
  );
  const shopUrl = buildShopUrl(data.profile.username);
  const showEmpty = recentOrders.length === 0 && productCount === 0;

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
        onCountdownExpire={load}
      />

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
            <span className="seller-assets-count">{recentOrders.length}</span>
          </div>
          <div className="asset-list">
            {recentOrders.length === 0 ? (
              <p className="text-muted">Aucune commande</p>
            ) : (
              recentOrders.map((order) => (
                <AssetRow
                  key={order.id}
                  title={order.productName}
                  subtitle={order.clientName || "Client"}
                  amount={order.productPrice}
                  status={order.status}
                />
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
