"use client";

import { useRouter } from "next/navigation";
import { formatCurrency, getOrderTotal } from "@/lib/utils";
import { buildPaymentLinkPath } from "@/lib/site-url";
import { IconPackage } from "@/components/ui/AppIcon";

interface ShopProduct {
  id: string;
  paymentSlug: string;
  name: string;
  price: number;
  deliveryCost: number;
  image: string;
}

export function SellerShopClient({
  products,
}: {
  products: ShopProduct[];
}) {
  const router = useRouter();

  return (
    <section className="seller-home shop-product-list">
      {products.length === 0 ? (
        <div className="shop-public-empty">
          <p className="shop-public-empty-title">Boutique vide pour le moment</p>
          <p className="shop-public-empty-desc text-muted">
            Ce vendeur n&apos;a pas encore publié de produit actif.
          </p>
          <p className="shop-public-empty-hint text-subtle">
            Vendeur ? Connectez-vous puis ouvrez l&apos;onglet <strong>Boutique</strong> pour ajouter vos produits.
          </p>
        </div>
      ) : (
        products.map((product) => (
          <article key={product.id} className="product-card animate-fade-up">
            {product.image ? (
              <img src={product.image} alt={product.name} className="product-card-media" />
            ) : (
              <div className="product-card-media-placeholder">
                <IconPackage size={32} />
              </div>
            )}
            <div className="product-card-body">
              <p className="product-card-price">
                {formatCurrency(getOrderTotal({ productPrice: product.price, deliveryCost: product.deliveryCost || 0 }))}
              </p>
              <p className="product-card-name">{product.name}</p>
              <button
                type="button"
                onClick={() => router.push(buildPaymentLinkPath(product.paymentSlug))}
                className="btn-primary product-card-cta"
              >
                Payer en sécurité
              </button>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
