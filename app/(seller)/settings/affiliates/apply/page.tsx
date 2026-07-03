"use client";

import { useRouter } from "next/navigation";
import { AffiliateApplyForm } from "@/components/seller/AffiliateApplyForm";

export default function AffiliateApplyPage() {
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
        <h1 className="settings-page-title">Demande d&apos;affiliation</h1>
      </header>

      <AffiliateApplyForm />
    </div>
  );
}
