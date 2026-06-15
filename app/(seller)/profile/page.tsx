"use client";

import Link from "next/link";
import { buildShopPath } from "@/lib/site-url";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { useSellerData } from "@/components/seller/SellerDataProvider";

export default function ProfilePage() {
  const { data, loading } = useSellerData();
  const profile = data?.profile ?? null;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  };

  if (loading && !profile) return <DashboardSkeleton />;

  if (!profile) return null;

  return (
    <div className="seller-dashboard">
      <section className="balance-secondary animate-fade-up" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <div className="avatar-mark" style={{ width: 56, height: 56, fontSize: "1.25rem" }}>
          {profile.displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: "1.125rem" }}>{profile.displayName}</p>
          <p className="text-muted">@{profile.username}</p>
        </div>
      </section>

      <section className="history-list animate-fade-up-d1">
        {[
          ["Boutique", profile.businessName],
          ["Pays", "Sénégal"],
          ["Devise", "FCFA"],
          ...(profile.phone ? [["Téléphone", profile.phone] as const] : []),
        ].map(([label, value]) => (
          <div key={label} className="history-item">
            <span className="text-muted">{label}</span>
            <span style={{ fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </section>

      <Link href={buildShopPath(profile.username)} className="btn-secondary">
        Voir ma boutique
      </Link>
      <button type="button" onClick={logout} className="btn-ghost" style={{ width: "100%" }}>
        Se déconnecter
      </button>
    </div>
  );
}
