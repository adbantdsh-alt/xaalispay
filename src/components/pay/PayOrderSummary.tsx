/** Bloc résumé commande (image gauche / infos droite) — design validé, ne pas modifier. */
"use client";

import { formatCurrency } from "@/lib/utils";
import { IconCheck, IconPackage } from "@/components/ui/AppIcon";
import s from "./PayOrderSummary.module.css";

export function PayOrderSummary({
  productName,
  productImage,
  productPrice,
  deliveryCost,
  seller,
}: {
  productName: string;
  productImage?: string;
  productPrice: number;
  deliveryCost: number;
  seller: { displayName: string; username: string; phone?: string };
}) {
  const total = productPrice + deliveryCost;
  const initial = seller.displayName.charAt(0).toUpperCase();
  const phoneDigits = seller.phone?.replace(/\D/g, "");

  return (
    <article className={s.card}>
      <div className={s.media}>
        {productImage ? (
          <img src={productImage} alt={productName} className={s.img} />
        ) : (
          <div className={s.imgEmpty} aria-hidden="true">
            <IconPackage size={40} />
          </div>
        )}
      </div>

      <div className={s.info}>
        <h1 className={s.name}>{productName}</h1>

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
          <div className={`${s.priceRow} ${s.totalRow}`}>
            <span className={s.totalLabel}>Total</span>
            <span className={s.totalValue}>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className={s.vendor}>
          <div className={s.vendorTop}>
            <span className={s.vendorAvatar}>{initial}</span>
            <div className={s.vendorTexts}>
              <p className={s.vendorName}>{seller.displayName}</p>
              <p className={s.vendorTag}>@{seller.username}</p>
            </div>
          </div>
          <div className={s.vendorBottom}>
            <span className={s.badge}>
              <IconCheck size={12} /> Vendeur vérifié
            </span>
            {seller.phone ? (
              <a
                href={phoneDigits ? `tel:+221${phoneDigits}` : undefined}
                className={s.phone}
              >
                {seller.phone}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
