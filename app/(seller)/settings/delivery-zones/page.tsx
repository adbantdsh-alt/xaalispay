"use client";

import { useRouter } from "next/navigation";
import { DeliveryZonesManager } from "@/components/seller/DeliveryZonesManager";

export default function DeliveryZonesSettingsPage() {
  const router = useRouter();

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
        <h1 className="settings-page-title">Zones de livraison</h1>
      </header>

      <section className="settings-section">
        <p className="text-muted" style={{ marginBottom: "0.75rem" }}>
          Définissez les zones dans lesquelles vous livrez et leur prix. Elles seront proposées par défaut sur
          chaque nouveau produit — vous pourrez en retirer pour un produit qui n&apos;est pas livré partout.
        </p>
        <DeliveryZonesManager />
      </section>
    </div>
  );
}
