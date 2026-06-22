"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, extractApiError } from "@/lib/api-client";
import { adaptProductRow } from "./admin-adapters";
import { AdminProductsSection } from "./AdminProductsSection";
import { handleAdminAuthStatus } from "./AdminDataProvider";
import type { ProductRow } from "./admin-types";

const AUTO_REFRESH_MS = 15_000;

export function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const lastParamsRef = useRef<{ search?: string; active?: string; ordering?: string }>({});
  const busyRef = useRef(false);
  useEffect(() => {
    busyRef.current = deactivatingId !== null;
  }, [deactivatingId]);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  };

  const fetchProducts = useCallback(
    async (params?: { search?: string; active?: string; ordering?: string }, silent = false) => {
      if (params) lastParamsRef.current = params;
      if (!silent) setLoading(true);
      const qs = new URLSearchParams();
      const { search, active, ordering } = lastParamsRef.current;
      if (search) qs.set("search", search);
      if (active) qs.set("active", active);
      if (ordering) qs.set("ordering", ordering);
      const res = await apiFetch(`/api/admin/products${qs.toString() ? `?${qs}` : ""}`);
      if (handleAdminAuthStatus(res.status, router, "/admin/products")) return;
      if (res.ok) setProducts((await res.json()).map(adaptProductRow));
      if (!silent) setLoading(false);
    },
    [router]
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!busyRef.current) fetchProducts(undefined, true);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchProducts]);

  const deactivateProduct = async (productId: number) => {
    setDeactivatingId(productId);
    setError("");
    const res = await apiFetch(`/api/admin/products/${productId}/deactivate`, { method: "POST" });
    const data = await res.json();
    setDeactivatingId(null);
    if (!res.ok) {
      showError(extractApiError(data, "Désactivation impossible"));
      return;
    }
    await fetchProducts(undefined, true);
  };

  if (loading && products.length === 0) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      {error && <p className="admin-error">{error}</p>}
      <AdminProductsSection
        products={products}
        deactivatingId={deactivatingId}
        // silent: true — une recherche/filtre ne doit jamais redéclencher
        // l'écran de chargement (qui démonterait AdminProductsSection et
        // relancerait son effet de debounce au remontage, en boucle infinie).
        onSearch={(params) => fetchProducts(params, true)}
        onDeactivate={deactivateProduct}
      />
    </>
  );
}
