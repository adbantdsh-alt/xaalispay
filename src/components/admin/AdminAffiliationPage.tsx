"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, extractApiError } from "@/lib/api-client";
import {
  adaptAffiliateApplicationRow,
  adaptAffiliateProgramSummary,
  adaptApprovedAffiliateRow,
  adaptReferrerGroupRow,
} from "./admin-adapters";
import { AdminAffiliationSection } from "./AdminAffiliationSection";
import { AdminAffiliateDetailModal } from "./AdminAffiliateDetailModal";
import { AdminAffiliateApplicationsPanel } from "./AdminAffiliateApplicationsPanel";
import { AdminApprovedAffiliatesPanel } from "./AdminApprovedAffiliatesPanel";
import { handleAdminAuthStatus } from "./AdminDataProvider";
import type { AffiliateApplicationRow, AffiliateProgramSummary, ApprovedAffiliateRow, ReferrerGroupRow } from "./admin-types";

const AUTO_REFRESH_MS = 30_000;

export function AdminAffiliationPage() {
  const router = useRouter();
  const [referrers, setReferrers] = useState<ReferrerGroupRow[]>([]);
  const [applications, setApplications] = useState<AffiliateApplicationRow[]>([]);
  const [members, setMembers] = useState<ApprovedAffiliateRow[]>([]);
  const [summary, setSummary] = useState<AffiliateProgramSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const lastParamsRef = useRef<{ search?: string; ordering?: string }>({});

  // Modal state
  const [detailReferrerId, setDetailReferrerId] = useState<number | null>(null);
  const [detailReferrerName, setDetailReferrerName] = useState("");

  const fetchApplications = useCallback(async () => {
    const res = await apiFetch("/api/admin/affiliates/applications?status=pending");
    if (res.ok) setApplications((await res.json()).map(adaptAffiliateApplicationRow));
  }, []);

  const fetchMembers = useCallback(async () => {
    const res = await apiFetch("/api/admin/affiliates/members");
    if (res.ok) setMembers((await res.json()).map(adaptApprovedAffiliateRow));
  }, []);

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
    fetchApplications();
    fetchMembers();
    fetchSummary();
    fetchReferrers();
  }, [fetchApplications, fetchMembers, fetchSummary, fetchReferrers]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchApplications();
      fetchMembers();
      fetchReferrers(undefined, true);
      fetchSummary();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchApplications, fetchMembers, fetchReferrers, fetchSummary]);

  const approveApplication = async (id: number) => {
    const res = await apiFetch(`/api/admin/affiliates/applications/${id}/approve`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(extractApiError(data, "Approbation impossible"));
      return false;
    }
    setError("");
    await Promise.all([fetchApplications(), fetchMembers()]);
    return true;
  };

  const rejectApplication = async (id: number, adminNote: string) => {
    const res = await apiFetch(`/api/admin/affiliates/applications/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ admin_note: adminNote }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(extractApiError(data, "Rejet impossible"));
      return false;
    }
    setError("");
    await fetchApplications();
    return true;
  };

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
      {applications.length > 0 && (
        <AdminAffiliateApplicationsPanel
          applications={applications}
          onApprove={approveApplication}
          onReject={rejectApplication}
        />
      )}
      <AdminAffiliationSection
        referrers={referrers}
        summary={summary}
        onSearch={(params) => fetchReferrers(params, true)}
        onExtendAllBoost={extendAllBoost}
        onOpenDetail={openDetail}
      />
      <AdminApprovedAffiliatesPanel affiliates={members} onExtendAllBoost={extendAllBoost} />
      <AdminAffiliateDetailModal
        referrerId={detailReferrerId}
        referrerName={detailReferrerName}
        onClose={closeDetail}
      />
    </>
  );
}
