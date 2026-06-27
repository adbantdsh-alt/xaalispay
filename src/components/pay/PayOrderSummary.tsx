/** Bloc résumé commande (image gauche / infos droite) — design validé, ne pas modifier. */
"use client";

import { formatCurrency } from "@/lib/utils";
import { FEE_POLICY } from "@/lib/fees";
import { IconCheck, IconPackage } from "@/components/ui/AppIcon";
import { ProductImage } from "@/components/ui/ProductImage";
import s from "./PayOrderSummary.module.css";

export function PayOrderSummary({
  productName,
  productImage,
  productPrice,
  deliveryCost,
  buyerProtectionFee,
  seller,
}: {
  productName: string;
  productImage?: string;
  productPrice: number;
  deliveryCost: number;
  buyerProtectionFee: number;
  seller: { displayName: string; username: string; phone?: string };
}) {
  const subtotal = productPrice + deliveryCost;
  const checkoutTotal = subtotal + buyerProtectionFee;
  const initial = seller.displayName.charAt(0).toUpperCase();
  const phoneDigits = seller.phone?.replace(/\D/g, "");

  return (
    <article className={s.card}>
      <div className={s.head}>
        <div className={s.media}>
          {productImage ? (
            <ProductImage
              src={productImage}
              alt={productName}
              className={s.img}
              placeholderClassName={s.imgEmpty}
              iconSize={22}
              width={56}
              height={56}
            />
          ) : (
            <div className={s.imgEmpty} aria-hidden="true">
              <IconPackage size={22} />
            </div>
          )}
        </div>

        <div className={s.headInfo}>
          <h1 className={s.name}>{productName}</h1>
          <div className={s.vendorInline}>
            <span className={s.vendorAvatar}>{initial}</span>
            <span className={s.vendorName}>{seller.displayName}</span>
            <span className={s.badge}>
              <IconCheck size={11} /> Vérifié
            </span>
            {seller.phone ? (
              <a href={phoneDigits ? `tel:+221${phoneDigits}` : undefined} className={s.phone}>
                {seller.phone}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className={s.prices}>
        <div className={s.priceRow}>
          <span className={s.priceLabel}>Prix</span>
          <span className={s.priceValue}>{formatCurrency(productPrice)}</span>
        </div>
        <div className={s.priceRow}>
          <span className={s.priceLabel}>Expédition</span>
          <span className={s.priceValue}>
            {deliveryCost > 0 ? formatCurrency(deliveryCost) : "Gratuite"}
          </span>
        </div>
        <div className={s.priceRow}>
          <span className={s.priceLabel}>{FEE_POLICY.buyer.label}</span>
          <span className={s.priceValue}>{formatCurrency(buyerProtectionFee)}</span>
        </div>
        <p className={s.feeHint}>
          {FEE_POLICY.buyer.shortLabel} — sans frais cachés.
        </p>
        <div className={s.totalRow}>
          <span className={s.totalLabel}>Total à payer</span>
          <span className={s.totalValue}>{formatCurrency(checkoutTotal)}</span>
        </div>
      </div>
    </article>
  );
}
