"use client";

import { buildSupportWhatsAppUrl, buildSellerPilotSupportMessage, isWithinPilotSupportWindow } from "@/lib/support";

export function SellerSupportCard({
  username,
  createdAt,
  onboardingIncomplete,
}: {
  username: string;
  createdAt: string;
  onboardingIncomplete?: boolean;
}) {
  const showBanner =
    onboardingIncomplete || isWithinPilotSupportWindow(createdAt);
  const supportUrl = buildSupportWhatsAppUrl(
    buildSellerPilotSupportMessage(username)
  );

  if (!showBanner || !supportUrl) return null;

  return (
    <section className="seller-support-card animate-fade-up">
      <div className="seller-support-card-body">
        <p className="seller-support-card-title">Support pilote WhatsApp</p>
        <p className="seller-support-card-desc">
          Une question sur votre boutique, un paiement ou un retrait ? Notre équipe vous répond
          rapidement pendant la phase pilote.
        </p>
      </div>
      <a
        href={supportUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-teal seller-support-card-btn"
      >
        Contacter sur WhatsApp
      </a>
    </section>
  );
}
