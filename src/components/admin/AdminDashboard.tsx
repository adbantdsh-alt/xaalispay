"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminDisputesSection } from "./AdminDisputesSection";
import { AdminOverviewSection } from "./AdminOverviewSection";
import { AdminPayoutsSection } from "./AdminPayoutsSection";
import type { AdminTab, DisputeRow, OverviewData, PayoutRow } from "./admin-types";

const AUTO_REFRESH_MS = 15_000;
const NO_CACHE = { cache: "no-store" as const };

const TABS: { id: AdminTab; label: string; badgeKey?: "disputes" | "payouts" }[] = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "disputes", label: "Litiges", badgeKey: "disputes" },
  { id: "payouts", label: "Retraits", badgeKey: "payouts" },
];

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
    const res = await fetch("/api/admin/overview", NO_CACHE);
    if (checkAuth(res.status)) return null;
    if (!res.ok) throw new Error("overview");
    const data = (await res.json()) as OverviewData;
    setOverview(data);
    return data;
  }, [checkAuth]);

  const fetchDisputes = useCallback(async () => {
    const res = await fetch("/api/admin/disputes", NO_CACHE);
    if (checkAuth(res.status)) return;
    if (res.ok) setDisputes((await res.json()).disputes || []);
  }, [checkAuth]);

  const fetchPayouts = useCallback(async () => {
    const res = await fetch("/api/admin/payouts", NO_CACHE);
    if (checkAuth(res.status)) return;
    if (res.ok) setPayouts((await res.json()).payouts || []);
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
        if (data && data.stats.openDisputes > 0) {
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
    action: "refund" | "release",
    force = false
  ): Promise<boolean> => {
    setResolving(disputeId + action);
    setError("");
    const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, force }),
    });
    const data = await res.json();
    setResolving(null);

    if (!res.ok) {
      if (res.status === 404) {
        await fetchDisputes();
        showError("Cette commande a déjà été traitée — la liste a été mise à jour.");
        return false;
      }
      if (data.canForce) {
        const confirmForce = window.confirm(
          `${data.error}\n\n` +
            `⚠️ AVANT DE CONFIRMER :\n` +
            `1. Connectez-vous au dashboard Bictorys\n` +
            `2. Vérifiez que la transaction est bien remboursée\n` +
            `3. Si oui, cliquez OK pour mettre à jour XaalisPay\n\n` +
            `Confirmer la mise à jour locale ?`
        );
        if (confirmForce) return resolveDispute(disputeId, action, true);
        return false;
      }
      showError(data.error || "Action impossible");
      return false;
    }

    if (data.warning) showError(`⚠️ ${data.warning}`);
    setDisputes(data.disputes || []);
    setTimeout(() => refresh(true), 2000);
    return true;
  };

  const retryPayout = async (payoutId: string) => {
    setRetryingId(payoutId);
    setError("");
    const res = await fetch(`/api/admin/payouts/${payoutId}/retry`, { method: "POST" });
    const data = await res.json();
    setRetryingId(null);
    if (!res.ok) {
      showError(data.error || "Relance impossible");
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

      {tab === "overview" && overview && (
        <AdminOverviewSection overview={overview} onNavigate={setTab} />
      )}

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
