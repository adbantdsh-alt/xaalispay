"use client";

import { buildWhatsAppUrl } from "@/lib/share";
import { CopyButton } from "./CopyButton";

export function ShareButtons({
  url,
  message,
  copyLabel = "Copier le lien",
}: {
  url: string;
  message: string;
  copyLabel?: string;
}) {
  const whatsappHref = buildWhatsAppUrl(message);

  return (
    <div className="share-buttons">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary share-btn-whatsapp"
        onClick={() => {
          try {
            localStorage.setItem("xp_onboarding_shared", "1");
          } catch {
            /* ignore */
          }
        }}
      >
        Partager sur WhatsApp
      </a>
      <CopyButton text={url} label={copyLabel} className="btn-secondary" />
    </div>
  );
}
