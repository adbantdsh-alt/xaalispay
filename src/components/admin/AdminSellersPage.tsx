"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { adaptSellerRow } from "./admin-adapters";
import { AdminSellersSection } from "./AdminSellersSection";
import { handleAdminAuthStatus } from "./AdminDataProvider";
import type { SellerRow } from "./admin-types";

const AUTO_REFRESH_MS = 15_000;

export function AdminSellersPage() {
  const router = useRouter();
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const lastParamsRef = useRef<{ search?: string; ordering?: string }>({});

  const fetchSellers = useCallback(
    async (params?: { search?: string; ordering?: string }, silent = false) => {
      if (params) lastParamsRef.current = params;
      if (!silent) setLoading(true);
      const qs = new URLSearchParams();
      const { search, ordering } = lastParamsRef.current;
      if (search) qs.set("search", search);
      if (ordering) qs.set("ordering", ordering);
      const res = await apiFetch(`/api/admin/sellers${qs.toString() ? `?${qs}` : ""}`);
      if (handleAdminAuthStatus(res.status, router, "/admin/sellers")) return;
      if (res.ok) setSellers((await res.json()).map(adaptSellerRow));
      if (!silent) setLoading(false);
    },
    [router]
  );

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  useEffect(() => {
    const id = setInterval(() => fetchSellers(undefined, true), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchSellers]);

  if (loading && sellers.length === 0) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  // silent: true — une recherche/tri ne doit jamais redéclencher l'écran de
  // chargement (qui démonterait AdminSellersSection et relancerait son effet
  // de debounce au remontage, en boucle infinie).
  return <AdminSellersSection sellers={sellers} onSearch={(params) => fetchSellers(params, true)} />;
}
