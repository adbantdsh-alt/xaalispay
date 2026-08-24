"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { adaptConnectPlatformRow } from "./admin-adapters";
import { AdminConnectPlatformDetail } from "./AdminConnectPlatformDetail";
import { AdminConnectSection } from "./AdminConnectSection";
import { handleAdminAuthStatus } from "./AdminDataProvider";
import type { ConnectOverviewData, ConnectPlatformRow } from "./admin-types";

const AUTO_REFRESH_MS = 30_000;

export function AdminConnectPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<ConnectOverviewData | null>(null);
  const [platforms, setPlatforms] = useState<ConnectPlatformRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);
  const lastParamsRef = useRef<{ search?: string; ordering?: string }>({});

  const fetchOverview = useCallback(async () => {
    const res = await apiFetch("/api/admin/connect/overview");
    if (handleAdminAuthStatus(res.status, router, "/admin/connect")) return;
    if (res.ok) setOverview(await res.json());
  }, [router]);

  const fetchPlatforms = useCallback(
    async (params?: { search?: string; ordering?: string }, silent = false) => {
      if (params) lastParamsRef.current = params;
      if (!silent) setLoading(true);
      const qs = new URLSearchParams();
      const { search, ordering } = lastParamsRef.current;
      if (search) qs.set("search", search);
      if (ordering) qs.set("ordering", ordering);
      const res = await apiFetch(`/api/admin/connect/platforms${qs.toString() ? `?${qs}` : ""}`);
      if (handleAdminAuthStatus(res.status, router, "/admin/connect")) return;
      if (res.ok) setPlatforms((await res.json()).map(adaptConnectPlatformRow));
      if (!silent) setLoading(false);
    },
    [router]
  );

  useEffect(() => {
    fetchOverview();
    fetchPlatforms();
  }, [fetchOverview, fetchPlatforms]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchOverview();
      fetchPlatforms(undefined, true);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchOverview, fetchPlatforms]);

  if (loading && platforms.length === 0 && !overview) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <AdminConnectSection
        overview={overview}
        platforms={platforms}
        onSearchPlatforms={(params) => fetchPlatforms(params, true)}
        onSelectPlatform={setSelectedPlatformId}
      />
      {selectedPlatformId && (
        <AdminConnectPlatformDetail platformId={selectedPlatformId} onClose={() => setSelectedPlatformId(null)} />
      )}
    </>
  );
}
