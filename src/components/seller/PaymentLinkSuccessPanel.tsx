"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CopyButton } from "@/components/ui/CopyButton";
import { IconCheck, IconPackage } from "@/components/ui/AppIcon";
import { ProductImage } from "@/components/ui/ProductImage";
import { buildPaymentLinkMessage, buildWhatsAppUrl, copyToClipboard } from "@/lib/share";
import { formatPublicUrl } from "@/lib/site-url";
import { splitCurrency } from "@/lib/utils";

export function PaymentLinkSuccessPanel({
  payUrl,
  productName,
  productPrice,
  productImage,
  productId,
  editHref,
  title = "Produit créé",
  subtitle,
  onReset,
  resetLabel = "Autre produit",
  autoCopy = true,
  showWhatsApp = true,
  showEdit = true,
}: {
  payUrl: string;
  productName: string;
  productPrice?: number;
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

  const productLine =
    productPrice !== undefined ? `${productName} · ${splitCurrency(productPrice)[0]} F CFA` : productName;

  const editLink =
    editHref || (productId ? `/create?tab=edit&id=${encodeURIComponent(productId)}` : undefined);

  return (
    <div className="link-success-panel">
      <div className="link-success-media">
        {productImage ? (
          <ProductImage
            src={productImage}
            alt={productName}
            className="link-success-product-img"
            placeholderClassName="link-success-product-img link-success-product-img-empty"
            iconSize={36}
            width={400}
            height={200}
          />
        ) : (
          <div className="link-success-product-img link-success-product-img-empty" aria-hidden>
            <IconPackage size={36} />
          </div>
        )}
        <div className="link-success-icon">
          <IconCheck size={22} />
        </div>
      </div>

      <h2 className="link-success-title">{title}</h2>
      <p className="link-success-desc text-muted">
        {productLine}
        <br />
        {subtitle || "Partagez le lien — le paiement est sécurisé."}
      </p>

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

      <div className="link-success-actions link-success-actions-stack">
        {showWhatsApp && (
          <button
            type="button"
            className="btn-seller-primary"
            onClick={() =>
              window.open(
                buildWhatsAppUrl(
                  buildPaymentLinkMessage(payUrl, productName || "votre commande")
                ),
                "_blank"
              )
            }
          >
            Partager sur WhatsApp
          </button>
        )}
        <CopyButton
          text={payUrl}
          label="Copier le lien"
          copiedLabel="✓ Copié"
          className="btn-ghost"
        />
      </div>

      {(showEdit && editLink) || onReset ? (
        <div className="link-success-secondary-row">
          {showEdit && editLink && (
            <Link href={editLink} className="btn-ghost link-success-edit">
              Modifier
            </Link>
          )}
          {onReset && (
            <button type="button" onClick={onReset} className="btn-ghost link-success-edit">
              {resetLabel}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
