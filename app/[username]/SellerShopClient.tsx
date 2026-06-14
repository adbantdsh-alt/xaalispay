"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  deliveryHours: number;
  deliveryLabel: string;
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
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--muted)]">
        Produits
      </h2>

      {error && (
        <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {products.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-3xl">📦</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Ce vendeur n&apos;a pas encore de produits
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <article key={product.id} className="card p-4">
              <div className="flex gap-3">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#0F1F66]/5 text-2xl">
                    📦
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">{product.name}</h3>
                  {product.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-[var(--muted)]">
                      {product.description}
                    </p>
                  )}
                  <p className="mt-2 text-lg font-bold">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Livraison sous {product.deliveryLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handlePay(product.id)}
                disabled={loadingId === product.id}
                className="btn-accent mt-4 w-full"
              >
                {loadingId === product.id ? "Préparation..." : "Payer"}
              </button>
            </article>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        Paiement sécurisé · Fonds en séquestre · Pas de compte requis
      </p>
    </section>
  );
}
