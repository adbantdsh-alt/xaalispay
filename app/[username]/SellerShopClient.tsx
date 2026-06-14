"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, getOrderTotal } from "@/lib/utils";
import { BrandMark } from "@/components/ui/BrandMark";

interface ShopProduct {
  id: string;
  name: string;
  price: number;
  deliveryCost: number;
  image: string;
}

export function SellerShopClient({
  username,
  products,
}: {
  username: string;
  products: ShopProduct[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handlePay = async (productId: string) => {
    setError("");
    setLoadingId(productId);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, productId }),
    });
    const data = await res.json();
    setLoadingId(null);
    if (!res.ok) {
      setError(data.error || "Impossible de créer la commande");
      return;
    }
    router.push(`/pay/${data.order.slug}`);
  };

  return (
    <section className="seller-home">
      {error && <p className="alert-danger">{error}</p>}

      {products.length === 0 ? (
        <p className="text-muted" style={{ textAlign: "center", padding: "3rem 0" }}>
          Aucun produit disponible
        </p>
      ) : (
        products.map((product) => (
          <article key={product.id} className="product-card animate-fade-up">
            {product.image ? (
              <img src={product.image} alt={product.name} className="product-card-media" />
            ) : (
              <div className="product-card-media-placeholder">📦</div>
            )}
            <div className="product-card-body">
              <p className="product-card-price">
                {formatCurrency(getOrderTotal({ productPrice: product.price, deliveryCost: product.deliveryCost || 0 }))}
              </p>
              <p className="product-card-name">{product.name}</p>
              <button
                type="button"
                onClick={() => handlePay(product.id)}
                disabled={loadingId === product.id}
                className="btn-primary"
                style={{ marginTop: "1.25rem" }}
              >
                {loadingId === product.id ? "Chargement…" : "Payer en sécurité"}
              </button>
            </div>
          </article>
        ))
      )}

      <p className="trust-badge">🔒 Paiement sécurisé XaalisPay</p>
    </section>
  );
}
