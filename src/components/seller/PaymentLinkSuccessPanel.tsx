"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CopyButton } from "@/components/ui/CopyButton";
import { IconCheck, IconPackage } from "@/components/ui/AppIcon";
import { ProductImage } from "@/components/ui/ProductImage";
import { buildPaymentLinkMessage, buildWhatsAppUrl, copyToClipboard } from "@/lib/share";
import { formatPublicUrl } from "@/lib/site-url";

export function PaymentLinkSuccessPanel({
  payUrl,
  productName,
  productImage,
  productId,
  editHref,
  title = "Produit créé !",
  subtitle,
  onReset,
  resetLabel = "+ Créer un autre produit",
  autoCopy = true,
  showWhatsApp = true,
  showEdit = true,
}: {
  payUrl: string;
  productName: string;
  productImage?: string;
  productId?: string;
  /** Lien vers la page d'édition (ex. /create?tab=edit&id=...) */
  editHref?: string;
  title?: string;
  subtitle?: string;
  onReset?: () => void;
  resetLabel?: string;
  autoCopy?: boolean;
  showWhatsApp?: boolean;
  showEdit?: boolean;
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

  const editLink =
    editHref || (productId ? `/create?tab=edit&id=${encodeURIComponent(productId)}` : undefined);

  return (
    <div className="link-success-panel">
      {productImage ? (
        <ProductImage
          src={productImage}
          alt={productName}
          className="link-success-product-img"
          placeholderClassName="link-success-product-img link-success-product-img-empty"
          iconSize={36}
        />
      ) : (
        <div className="link-success-product-img link-success-product-img-empty" aria-hidden>
          <IconPackage size={36} />
        </div>
      )}

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

      <div className="link-success-actions">
        <CopyButton
          text={payUrl}
          label="Copier le lien"
          copiedLabel="✓ Copié"
          className="btn-seller-primary link-success-action-btn"
        />
        {showWhatsApp && (
          <button
            type="button"
            className="btn-whatsapp-compact link-success-action-btn"
            onClick={() =>
              window.open(
                buildWhatsAppUrl(
                  buildPaymentLinkMessage(payUrl, productName || "votre commande")
                ),
                "_blank"
              )
            }
          >
            WhatsApp
          </button>
        )}
      </div>

      {showEdit && editLink && (
        <Link href={editLink} className="btn-secondary link-success-edit">
          Modifier le produit
        </Link>
      )}

      {onReset && (
        <button type="button" onClick={onReset} className="btn-ghost btn-inline link-success-new">
          {resetLabel}
        </button>
      )}
    </div>
  );
}
