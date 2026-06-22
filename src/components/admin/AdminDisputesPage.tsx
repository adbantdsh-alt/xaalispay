"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, extractApiError } from "@/lib/api-client";
import { adaptDisputeRow } from "./admin-adapters";
import { AdminDisputesSection } from "./AdminDisputesSection";
import { handleAdminAuthStatus, useAdminData } from "./AdminDataProvider";
import type { DisputeRow } from "./admin-types";

const AUTO_REFRESH_MS = 15_000;

export function AdminDisputesPage() {
  const router = useRouter();
  const { refresh: refreshOverview } = useAdminData();
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  useEffect(() => {
    busyRef.current = busy || resolving !== null;
  }, [busy, resolving]);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  };

  const fetchDisputes = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await apiFetch("/api/admin/orders?status=dispute");
    if (handleAdminAuthStatus(res.status, router, "/admin/disputes")) return;
    if (res.ok) setDisputes((await res.json()).map(adaptDisputeRow));
    if (!silent) setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!busyRef.current) fetchDisputes(true);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchDisputes]);

  const resolveDispute = async (
    disputeId: string,
    action: "release_full" | "refund_full" | "split",
    refundAmount?: number
  ): Promise<boolean> => {
    setResolving(disputeId + action);
    setError("");
    const res = await apiFetch(`/api/orders/${disputeId}/resolve-dispute`, {
      method: "POST",
      body: JSON.stringify({ resolution_action: action, refund_amount: refundAmount }),
    });
    const data = await res.json();
    setResolving(null);

    if (!res.ok) {
      if (res.status === 404) {
        await fetchDisputes(true);
        showError("Cette commande a déjà été traitée — la liste a été mise à jour.");
        return false;
      }
      showError(extractApiError(data, "Action impossible"));
      return false;
    }

    if (data.warning) showError(`⚠️ ${data.warning}`);
    await fetchDisputes(true);
    refreshOverview({ silent: true });
    return true;
  };

  if (loading && disputes.length === 0) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      {error && <p className="admin-error">{error}</p>}
      <AdminDisputesSection
        disputes={disputes}
        resolving={resolving}
        onResolve={resolveDispute}
        onActivityChange={setBusy}
      />
    </>
  );
}
