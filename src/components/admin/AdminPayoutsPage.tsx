"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, extractApiError } from "@/lib/api-client";
import { adaptPayoutRow } from "./admin-adapters";
import { AdminPayoutsSection } from "./AdminPayoutsSection";
import { handleAdminAuthStatus, useAdminData } from "./AdminDataProvider";
import type { PayoutRow } from "./admin-types";

const AUTO_REFRESH_MS = 15_000;

export function AdminPayoutsPage() {
  const router = useRouter();
  const { refresh: refreshOverview } = useAdminData();
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [forcingId, setForcingId] = useState<string | null>(null);
  const busyRef = useRef(false);
  useEffect(() => {
    busyRef.current = retryingId !== null || forcingId !== null;
  }, [retryingId, forcingId]);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  };

  const fetchPayouts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await apiFetch("/api/admin/payouts");
    if (handleAdminAuthStatus(res.status, router, "/admin/payouts")) return;
    if (res.ok) setPayouts((await res.json()).map(adaptPayoutRow));
    if (!silent) setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!busyRef.current) fetchPayouts(true);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchPayouts]);

  const retryPayout = async (payoutId: string) => {
    setRetryingId(payoutId);
    setError("");
    const res = await apiFetch(`/api/admin/payouts/${payoutId}/retry`, { method: "POST" });
    const data = await res.json();
    setRetryingId(null);
    if (!res.ok) {
      showError(extractApiError(data, "Relance impossible"));
      return;
    }
    await fetchPayouts(true);
    refreshOverview({ silent: true });
  };

  if (loading && payouts.length === 0) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  const forceSucceedPayout = async (payoutId: string) => {
    if (!confirm("Marquer ce retrait comme réussi sans vérification PSP ? À faire uniquement si Bictorys confirme que le virement est arrivé.")) return;
    setForcingId(payoutId);
    setError("");
    const res = await apiFetch(`/api/admin/payouts/${payoutId}/force-succeed`, { method: "POST" });
    const data = await res.json();
    setForcingId(null);
    if (!res.ok) {
      showError(extractApiError(data, "Impossible de forcer le statut"));
      return;
    }
    await fetchPayouts(true);
    refreshOverview({ silent: true });
  };

  return (
    <>
      {error && <p className="admin-error">{error}</p>}
      <AdminPayoutsSection
        payouts={payouts}
        retryingId={retryingId}
        onRetry={retryPayout}
        forcingId={forcingId}
        onForceSucceed={forceSucceedPayout}
      />
    </>
  );
}
