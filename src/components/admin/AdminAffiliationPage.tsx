"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, extractApiError } from "@/lib/api-client";
import { adaptAffiliateProgramSummary, adaptAffiliateRow, adaptReferrerGroupRow } from "./admin-adapters";
import { AdminAffiliationSection } from "./AdminAffiliationSection";
import { AdminAffiliateDetailModal } from "./AdminAffiliateDetailModal";
import { handleAdminAuthStatus } from "./AdminDataProvider";
import type { AffiliateProgramSummary, AffiliateRow, ReferrerGroupRow } from "./admin-types";

const AUTO_REFRESH_MS = 15_000;

export function AdminAffiliationPage() {
  const router = useRouter();
  const [referrers, setReferrers] = useState<ReferrerGroupRow[]>([]);
  const [summary, setSummary] = useState<AffiliateProgramSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const lastParamsRef = useRef<{ search?: string; ordering?: string }>({});

  // Modal state
  const [detailReferrerId, setDetailReferrerId] = useState<number | null>(null);
  const [detailReferrerName, setDetailReferrerName] = useState("");

  const fetchSummary = useCallback(async () => {
    const res = await apiFetch("/api/admin/affiliates/summary");
    if (res.ok) setSummary(adaptAffiliateProgramSummary(await res.json()));
  }, []);

  const fetchReferrers = useCallback(
    async (params?: { search?: string; ordering?: string }, silent = false) => {
      if (params) lastParamsRef.current = params;
      if (!silent) setLoading(true);
      const qs = new URLSearchParams();
      const { search, ordering } = lastParamsRef.current;
      if (search) qs.set("search", search);
      if (ordering) qs.set("ordering", ordering);
      const res = await apiFetch(`/api/admin/affiliates/referrers${qs.toString() ? `?${qs}` : ""}`);
      if (handleAdminAuthStatus(res.status, router, "/admin/affiliation")) return;
      if (res.ok) setReferrers((await res.json()).map(adaptReferrerGroupRow));
      if (!silent) setLoading(false);
    },
    [router]
  );

  useEffect(() => {
    fetchSummary();
    fetchReferrers();
  }, [fetchSummary, fetchReferrers]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchReferrers(undefined, true);
      fetchSummary();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchReferrers, fetchSummary]);

  const extendAllBoost = async (referrerId: number, days: number) => {
    const res = await apiFetch(`/api/admin/affiliates/referrers/${referrerId}/extend-all`, {
      method: "POST",
      body: JSON.stringify({ days }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(extractApiError(data, "Prolongation impossible"));
      return false;
    }
    setError("");
    await Promise.all([fetchReferrers(undefined, true), fetchSummary()]);
    return true;
  };

  const extendBoost = async (referralId: string, days: number) => {
    const res = await apiFetch(`/api/admin/affiliates/${referralId}/extend`, {
      method: "POST",
      body: JSON.stringify({ days }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(extractApiError(data, "Prolongation impossible"));
      return false;
    }
    setError("");
    return true;
  };

  const openDetail = (referrerId: number, businessName: string) => {
    setDetailReferrerId(referrerId);
    setDetailReferrerName(businessName);
  };

  const closeDetail = () => {
    setDetailReferrerId(null);
    setDetailReferrerName("");
  };

  if (loading && referrers.length === 0) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      {error && <p className="admin-error">{error}</p>}
      <AdminAffiliationSection
        referrers={referrers}
        summary={summary}
        onSearch={(params) => fetchReferrers(params, true)}
        onExtendAllBoost={extendAllBoost}
        onOpenDetail={openDetail}
      />
      <AdminAffiliateDetailModal
        referrerId={detailReferrerId}
        referrerName={detailReferrerName}
        onClose={closeDetail}
        onExtendBoost={extendBoost}
      />
    </>
  );
}
