"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, extractApiError } from "@/lib/api-client";
import { AdminDisputesSection } from "./AdminDisputesSection";
import { AdminOverviewSection } from "./AdminOverviewSection";
import { AdminPayoutsSection } from "./AdminPayoutsSection";
import type { AdminTab, DisputeRow, OverviewData, PayoutRow } from "./admin-types";

const AUTO_REFRESH_MS = 15_000;

const TABS: { id: AdminTab; label: string; badgeKey?: "disputes" | "payouts" }[] = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "disputes", label: "Litiges", badgeKey: "disputes" },
  { id: "payouts", label: "Retraits", badgeKey: "payouts" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptDisputeRow(o: any): DisputeRow {
  return {
    id: String(o.id),
    slug: o.slug,
    sellerId: "",
    sellerUsername: o.seller_username,
    sellerName: o.seller_business_name,
    sellerPhone: o.seller_phone || null,
    productName: o.product_name,
    clientName: o.client_name,
    clientPhone: o.client_phone,
    clientAddress: o.client_address || null,
    status: o.status,
    total: o.total_amount,
    buyerProtectionFee: o.buyer_protection_fee || 0,
    paymentMethod: o.payment_method,
    paidAt: o.paid_at || undefined,
    clientDeliveryConfirmedAt: o.delivery_validated_at || undefined,
    disputeOpenedAt: o.dispute_opened_at || undefined,
    disputeReason: o.dispute_reason || "",
    disputeMedia: o.dispute_media || [],
    disputePhotos: [],
    createdAt: o.created_at,
    updatedAt: o.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptPayoutRow(p: any): PayoutRow {
  return {
    id: String(p.id),
    sellerUsername: p.seller_username,
    sellerName: p.seller_business_name,
    amount: p.amount,
    method: p.method,
    phone: p.phone,
    status: p.status,
    failureReason: p.failure_reason || undefined,
    createdAt: p.created_at,
  };
}

export function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [resolving, setResolving] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [disputesBusy, setDisputesBusy] = useState(false);
  const [initialTabSet, setInitialTabSet] = useState(false);

  const refreshingRef = useRef(false);
  const tabRef = useRef(tab);
  const busyRef = useRef(false);
  tabRef.current = tab;
  busyRef.current = disputesBusy || resolving !== null || retryingId !== null;

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  };

  const checkAuth = useCallback(
    (status: number) => {
      if (status === 401) {
        router.replace("/auth?redirect=/admin");
        return true;
      }
      if (status === 403) {
        router.replace("/dashboard");
        return true;
      }
      return false;
    },
    [router]
  );

  const fetchOverview = useCallback(async () => {
    const res = await apiFetch("/api/admin/overview");
    if (checkAuth(res.status)) return null;
    if (!res.ok) throw new Error("overview");
    const data = (await res.json()) as OverviewData;
    setOverview(data);
    return data;
  }, [checkAuth]);

  const fetchDisputes = useCallback(async () => {
    const res = await apiFetch("/api/admin/orders?status=dispute");
    if (checkAuth(res.status)) return;
    if (res.ok) setDisputes((await res.json()).map(adaptDisputeRow));
  }, [checkAuth]);

  const fetchPayouts = useCallback(async () => {
    const res = await apiFetch("/api/admin/payouts");
    if (checkAuth(res.status)) return;
    if (res.ok) setPayouts((await res.json()).map(adaptPayoutRow));
  }, [checkAuth]);

  const fetchTab = useCallback(
    async (target: AdminTab) => {
      if (target === "disputes") await fetchDisputes();
      if (target === "payouts") await fetchPayouts();
    },
    [fetchDisputes, fetchPayouts]
  );

  const refresh = useCallback(
    async (silent = false) => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      if (silent) setAutoRefreshing(true);
      else {
        setError("");
        setLoading(true);
      }

      try {
        await fetchOverview();
        await fetchTab(tabRef.current);
        setLastUpdated(new Date());
      } catch {
        if (!silent) showError("Impossible de charger l'admin");
      } finally {
        refreshingRef.current = false;
        if (silent) setAutoRefreshing(false);
        else setLoading(false);
      }
    },
    [fetchOverview, fetchTab]
  );

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchOverview();
        if (data && data.open_disputes_count > 0) {
          setTab("disputes");
          await fetchDisputes();
        }
        setInitialTabSet(true);
        setLastUpdated(new Date());
      } catch {
        showError("Impossible de charger l'admin");
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchOverview, fetchDisputes]);

  useEffect(() => {
    if (loading || !initialTabSet) return;
    setTabLoading(true);
    fetchTab(tab).finally(() => setTabLoading(false));
  }, [tab, loading, initialTabSet, fetchTab]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!busyRef.current) refresh(true);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const resolveDispute = async (
    disputeId: string,
    action: "refund" | "release"
  ): Promise<boolean> => {
    setResolving(disputeId + action);
    setError("");
    const res = await apiFetch(`/api/orders/${disputeId}/resolve-dispute`, {
      method: "POST",
      body: JSON.stringify({ outcome: action }),
    });
    const data = await res.json();
    setResolving(null);

    if (!res.ok) {
      if (res.status === 404) {
        await fetchDisputes();
        showError("Cette commande a déjà été traitée — la liste a été mise à jour.");
        return false;
      }
      showError(extractApiError(data, "Action impossible"));
      return false;
    }

    if (data.warning) showError(`⚠️ ${data.warning}`);
    await fetchDisputes();
    setTimeout(() => refresh(true), 2000);
    return true;
  };

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
    await fetchPayouts();
    await fetchOverview();
  };

  const failedPayouts = payouts.filter((p) => p.status === "failed").length;

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-panel admin-panel--lite">
      <nav className="admin-tabs" aria-label="Sections admin">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`admin-tab ${tab === item.id ? "is-active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {item.badgeKey === "disputes" && disputes.length > 0 && (
              <span className="admin-tab-badge">{disputes.length}</span>
            )}
            {item.badgeKey === "payouts" && failedPayouts > 0 && (
              <span className="admin-tab-badge admin-tab-badge--warn">{failedPayouts}</span>
            )}
          </button>
        ))}
        <div className="admin-refresh-group">
          {lastUpdated && (
            <span className={`admin-last-updated ${autoRefreshing ? "admin-last-updated--syncing" : ""}`}>
              {autoRefreshing ? (
                <>
                  <span className="btn-spinner admin-sync-spinner" aria-hidden="true" />
                  Sync…
                </>
              ) : (
                <>
                  <span className="admin-live-dot" aria-hidden="true" />
                  {lastUpdated.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </>
              )}
            </span>
          )}
          <button type="button" className="admin-refresh" onClick={() => refresh(false)}>
            Actualiser
          </button>
        </div>
      </nav>

      {error && <p className="admin-error">{error}</p>}

      {tabLoading && tab !== "overview" && (
        <p className="admin-tab-loading text-muted">Chargement…</p>
      )}

      {tab === "overview" && overview && <AdminOverviewSection overview={overview} onNavigate={setTab} />}

      {tab === "disputes" && !tabLoading && (
        <AdminDisputesSection
          disputes={disputes}
          resolving={resolving}
          onResolve={resolveDispute}
          onActivityChange={setDisputesBusy}
        />
      )}

      {tab === "payouts" && !tabLoading && (
        <AdminPayoutsSection payouts={payouts} retryingId={retryingId} onRetry={retryPayout} />
      )}
    </div>
  );
}
