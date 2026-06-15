"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "@/components/ui/CopyButton";
import { IconCheck } from "@/components/ui/AppIcon";
import { buildPaymentLinkMessage, buildWhatsAppUrl, copyToClipboard } from "@/lib/share";
import { formatPublicUrl } from "@/lib/site-url";

export function PaymentLinkSuccessPanel({
  payUrl,
  productName,
  title = "Produit créé !",
  subtitle,
  onReset,
  resetLabel = "+ Créer un autre produit",
  autoCopy = true,
  showWhatsApp = true,
}: {
  payUrl: string;
  productName: string;
  title?: string;
  subtitle?: string;
  onReset?: () => void;
  resetLabel?: string;
  autoCopy?: boolean;
  showWhatsApp?: boolean;
}) {
  const [copiedHint, setCopiedHint] = useState(false);

  const flashCopied = () => {
    setCopiedHint(true);
    setTimeout(() => setCopiedHint(false), 3000);
  };

  useEffect(() => {
    if (!autoCopy || !payUrl) return;
    copyToClipboard(payUrl).then((ok) => {
      if (ok) flashCopied();
    });
  }, [autoCopy, payUrl]);

  const handleUrlTap = async () => {
    const ok = await copyToClipboard(payUrl);
    if (ok) flashCopied();
  };

  const desc =
    subtitle || `${productName} — partagez ce lien à vos clients.`;

  return (
    <div className="link-success-panel">
      <div className="link-success-icon">
        <IconCheck size={26} />
      </div>
      <h2 className="link-success-title">{title}</h2>
      <p className="link-success-desc text-muted">{desc}</p>

      {copiedHint && (
        <p className="link-auto-copied" role="status">
          <span className="copy-btn-copied">
            <IconCheck size={16} /> Lien copié ! Collez-le dans WhatsApp, SMS ou réseaux sociaux.
          </span>
        </p>
      )}

      <button
        type="button"
        className="link-success-url-box link-success-url-tap"
        onClick={handleUrlTap}
        aria-label="Copier le lien de paiement"
      >
        <p className="link-success-url">{formatPublicUrl(payUrl)}</p>
        <span className="link-success-url-hint">Appuyer pour copier</span>
      </button>

      <CopyButton
        text={payUrl}
        label="Copier le lien"
        copiedLabel="✓ Lien copié"
        className="btn-seller-primary link-copy-main"
      />

      {showWhatsApp && (
        <button
          type="button"
          className="btn-whatsapp-full"
          onClick={() =>
            window.open(
              buildWhatsAppUrl(
                buildPaymentLinkMessage(payUrl, productName || "votre commande")
              ),
              "_blank"
            )
          }
        >
          Envoyer sur WhatsApp
        </button>
      )}

      {onReset && (
        <button type="button" onClick={onReset} className="btn-ghost btn-inline link-success-new">
          {resetLabel}
        </button>
      )}
    </div>
  );
}
