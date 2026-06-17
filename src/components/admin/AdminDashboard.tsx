"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminAlertsBar } from "./AdminAlertsBar";
import { AdminDisputesSection } from "./AdminDisputesSection";
import { AdminOrdersSection } from "./AdminOrdersSection";
import { AdminOverviewSection } from "./AdminOverviewSection";
import { AdminPilotSection } from "./AdminPilotSection";
import { AdminPayoutsSection } from "./AdminPayoutsSection";
import { AdminSearchBar } from "./AdminSearchBar";
import { AdminVendorsSection } from "./AdminVendorsSection";
import type {
  AdminAlert,
  AdminOrderRow,
  AdminTab,
  AdminVendorRow,
  DisputeRow,
  OverviewData,
  PayoutRow,
  PilotDashboardData,
} from "./admin-types";

const AUTO_REFRESH_MS = 60_000;
const NO_CACHE = { cache: "no-store" as const };

const TABS: { id: AdminTab; label: string; badgeKey?: "disputes" | "payouts" | "pilote" | "orders" }[] = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "orders", label: "Commandes", badgeKey: "orders" },
  { id: "vendors", label: "Vendeurs" },
  { id: "pilote", label: "Pilote", badgeKey: "pilote" },
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
  const [pilot, setPilot] = useState<PilotDashboardData | null>(null);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [vendors, setVendors] = useState<AdminVendorRow[]>([]);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [resolving, setResolving] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [orderBusyId, setOrderBusyId] = useState<string | null>(null);
  const [opsBusy, setOpsBusy] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [disputesBusy, setDisputesBusy] = useState(false);
  const [initialTabSet, setInitialTabSet] = useState(false);

  const refreshingRef = useRef(false);
  const tabRef = useRef(tab);
  const busyRef = useRef(false);
  tabRef.current = tab;
  busyRef.current = disputesBusy || resolving !== null || retryingId !== null || opsBusy;

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
    setAlerts(data.alerts || []);
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

  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/admin/orders", NO_CACHE);
    if (checkAuth(res.status)) return;
    if (res.ok) setOrders((await res.json()).orders || []);
  }, [checkAuth]);

  const fetchVendors = useCallback(async () => {
    const res = await fetch("/api/admin/vendors", NO_CACHE);
    if (checkAuth(res.status)) return;
    if (res.ok) setVendors((await res.json()).vendors || []);
  }, [checkAuth]);

  const fetchPilot = useCallback(async () => {
    const res = await fetch("/api/admin/pilot", NO_CACHE);
    if (checkAuth(res.status)) return;
    if (res.ok) {
      const data = await res.json();
      setPilot(data.pilot || null);
    }
  }, [checkAuth]);

  const fetchTab = useCallback(
    async (target: AdminTab) => {
      if (target === "pilote") await fetchPilot();
      if (target === "disputes") await fetchDisputes();
      if (target === "payouts") await fetchPayouts();
      if (target === "orders") await fetchOrders();
      if (target === "vendors") await fetchVendors();
    },
    [fetchPilot, fetchDisputes, fetchPayouts, fetchOrders, fetchVendors]
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
        await fetchPilot();
        if (data && data.stats.openDisputes > 0) {
          setTab("disputes");
          await fetchDisputes();
        } else if (data && (data.bictorys?.pendingPayments || 0) > 5) {
          setTab("orders");
          await fetchOrders();
        }
        setInitialTabSet(true);
        setLastUpdated(new Date());
      } catch {
        showError("Impossible de charger l'admin");
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchOverview, fetchDisputes, fetchPilot, fetchOrders]);

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

  const runBatchOps = async (action: "reconcile" | "expire_stale") => {
    setOpsBusy(true);
    setError("");
    const res = await fetch("/api/admin/ops/reconcile-pending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: action === "expire_stale" ? "expire_stale" : undefined }),
    });
    const data = await res.json();
    setOpsBusy(false);
    if (!res.ok) {
      showError(data.error || "Action impossible");
      return;
    }
    if (action === "expire_stale") {
      showError(`✓ ${data.expired || 0} commande(s) expirée(s)`);
    } else {
      showError(`✓ ${data.confirmed || 0} confirmé(s) sur ${data.total || 0}`);
    }
    await refresh(true);
  };

  const orderOp = async (orderId: string, action: "reconcile" | "expire") => {
    setOrderBusyId(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}/ops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setOrderBusyId(null);
    if (!res.ok) {
      showError(data.error || "Action impossible");
      return;
    }
    await fetchOrders();
    await fetchOverview();
  };

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
  const pendingOrders = orders.filter((o) => o.status === "pending_payment").length;
  const pilotIncomplete =
    pilot && pilot.completeCount < pilot.target.min ? pilot.target.min - pilot.completeCount : 0;

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-panel admin-panel--lite">
      <div className="admin-topbar">
        <AdminSearchBar onNavigate={setTab} />
      </div>

      <AdminAlertsBar
        alerts={alerts}
        onNavigate={setTab}
        onReconcile={() => runBatchOps("reconcile")}
        onExpireStale={() => runBatchOps("expire_stale")}
        busy={opsBusy}
      />

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
            {item.badgeKey === "orders" && pendingOrders > 0 && (
              <span className="admin-tab-badge admin-tab-badge--warn">{pendingOrders}</span>
            )}
            {item.badgeKey === "pilote" && pilotIncomplete > 0 && (
              <span className="admin-tab-badge admin-tab-badge--warn">{pilotIncomplete}</span>
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
        <AdminOverviewSection
          overview={overview}
          onNavigate={setTab}
          onRefresh={() => refresh(true)}
        />
      )}

      {tab === "orders" && !tabLoading && (
        <AdminOrdersSection
          orders={orders}
          busyId={orderBusyId}
          onReconcile={(id) => orderOp(id, "reconcile")}
          onExpire={(id) => orderOp(id, "expire")}
          onRefresh={() => fetchOrders()}
        />
      )}

      {tab === "vendors" && !tabLoading && <AdminVendorsSection vendors={vendors} />}

      {tab === "pilote" && !tabLoading && pilot && <AdminPilotSection pilot={pilot} />}

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
