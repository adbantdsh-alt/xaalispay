"use client";

import { useRouter } from "next/navigation";
import { useSellerData } from "@/components/seller/SellerDataProvider";
import { AffiliatesManager } from "@/components/seller/AffiliatesManager";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

export default function AffiliatesSettingsPage() {
  const router = useRouter();
  const { data, loading } = useSellerData();
  const profile = data?.profile ?? null;

  return (
    <div className="settings-page animate-settings-slide">
      <header className="settings-page-head">
        <button
          type="button"
          className="icon-back-btn settings-page-back"
          aria-label="Retour"
          onClick={() => router.back()}
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="settings-page-title">Mes affiliés</h1>
      </header>

      {loading && !profile ? (
        <DashboardSkeleton />
      ) : profile ? (
        <AffiliatesManager username={profile.username} />
      ) : (
        <p className="text-muted">Profil introuvable</p>
      )}
    </div>
  );
}
