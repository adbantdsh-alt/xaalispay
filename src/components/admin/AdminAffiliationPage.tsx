"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, extractApiError } from "@/lib/api-client";
import { adaptAffiliateProgramSummary, adaptAffiliateRow } from "./admin-adapters";
import { AdminAffiliationSection } from "./AdminAffiliationSection";
import { handleAdminAuthStatus } from "./AdminDataProvider";
import type { AffiliateProgramSummary, AffiliateRow } from "./admin-types";

const AUTO_REFRESH_MS = 15_000;

export function AdminAffiliationPage() {
  const router = useRouter();
  const [referrals, setReferrals] = useState<AffiliateRow[]>([]);
  const [summary, setSummary] = useState<AffiliateProgramSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const lastParamsRef = useRef<{ search?: string; ordering?: string }>({});

  const fetchSummary = useCallback(async () => {
    const res = await apiFetch("/api/admin/affiliates/summary");
    if (res.ok) setSummary(adaptAffiliateProgramSummary(await res.json()));
  }, []);

  const fetchReferrals = useCallback(
    async (params?: { search?: string; ordering?: string }, silent = false) => {
      if (params) lastParamsRef.current = params;
      if (!silent) setLoading(true);
      const qs = new URLSearchParams();
      const { search, ordering } = lastParamsRef.current;
      if (search) qs.set("search", search);
      if (ordering) qs.set("ordering", ordering);
      const res = await apiFetch(`/api/admin/affiliates${qs.toString() ? `?${qs}` : ""}`);
      if (handleAdminAuthStatus(res.status, router, "/admin/affiliation")) return;
      if (res.ok) setReferrals((await res.json()).map(adaptAffiliateRow));
      if (!silent) setLoading(false);
    },
    [router]
  );

  useEffect(() => {
    fetchSummary();
    fetchReferrals();
  }, [fetchSummary, fetchReferrals]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchReferrals(undefined, true);
      fetchSummary();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchReferrals, fetchSummary]);

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
    await Promise.all([fetchReferrals(undefined, true), fetchSummary()]);
    return true;
  };

  if (loading && referrals.length === 0) {
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
        referrals={referrals}
        summary={summary}
        onSearch={(params) => fetchReferrals(params, true)}
        onExtendBoost={extendBoost}
      />
    </>
  );
}
