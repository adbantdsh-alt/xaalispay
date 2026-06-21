"use client";

import { useRouter } from "next/navigation";
import { buildPaymentLinkPath } from "@/lib/site-url";
import { IconArrowRight, IconPackage } from "@/components/ui/AppIcon";

export interface VendorProduct {
  id: string;
  paymentSlug: string;
  name: string;
  description: string;
  price: number;
  totalLabel: string;
  image: string;
}

export function VendorProductGrid({
  vendor,
  products,
  loading,
  onChangeVendor,
}: {
  vendor: { username: string; displayName: string; businessName: string };
  products: VendorProduct[];
  loading?: boolean;
  onChangeVendor: () => void;
}) {
  const router = useRouter();
  const initial = vendor.displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="vendor-picker-loading" aria-live="polite">
        <span className="vendor-search-spinner" />
        <span>Chargement des produits…</span>
      </div>
    );
  }

  return (
    <div className="vendor-picker">
      <div className="vendor-picker-head">
        <div className="vendor-picker-vendor">
          <span className="vendor-picker-avatar">{initial}</span>
          <div>
            <p className="vendor-picker-name">{vendor.displayName}</p>
            <p className="vendor-picker-tag">@{vendor.username}</p>
          </div>
        </div>
        <button type="button" className="vendor-picker-change" onClick={onChangeVendor}>
          Changer de vendeur
        </button>
      </div>

      {products.length === 0 ? (
        <p className="vendor-picker-empty">
          Ce vendeur n&apos;a pas encore de produit actif.
        </p>
      ) : (
        <ul className="vendor-picker-list" role="list">
          {products.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                className="vendor-picker-product"
                onClick={() => router.push(buildPaymentLinkPath(product.paymentSlug))}
              >
                <div className="vendor-picker-product-media">
                  {product.image ? (
                    <img src={product.image} alt="" />
                  ) : (
                    <span className="vendor-picker-product-placeholder" aria-hidden="true">
                      <IconPackage size={24} />
                    </span>
                  )}
                </div>
                <div className="vendor-picker-product-body">
                  <p className="vendor-picker-product-name">{product.name}</p>
                  {product.description ? (
                    <p className="vendor-picker-product-desc">{product.description}</p>
                  ) : null}
                  <p className="vendor-picker-product-price">{product.totalLabel}</p>
                </div>
                <span className="vendor-picker-product-go" aria-hidden="true">
                  <IconArrowRight size={18} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
