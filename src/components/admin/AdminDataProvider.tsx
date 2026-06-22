"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-client";
import type { OverviewData } from "./admin-types";

interface AdminDataContextValue {
  overview: OverviewData | null;
  loading: boolean;
  lastUpdated: Date | null;
  autoRefreshing: boolean;
  refresh: (options?: { silent?: boolean }) => Promise<OverviewData | null>;
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

let inflightOverview: Promise<OverviewData | null> | null = null;

async function fetchOverview(): Promise<OverviewData | null> {
  if (inflightOverview) return inflightOverview;

  inflightOverview = (async () => {
    const res = await apiFetch("/api/admin/overview");
    if (!res.ok) return null;
    return (await res.json()) as OverviewData;
  })().finally(() => {
    inflightOverview = null;
  });

  return inflightOverview;
}

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (options?.silent) setAutoRefreshing(true);
    else setLoading(true);

    const next = await fetchOverview();
    if (next) {
      setOverview(next);
      setLastUpdated(new Date());
    }

    if (options?.silent) setAutoRefreshing(false);
    else setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    refresh({ silent: false });
  }, [authLoading, refresh]);

  useEffect(() => {
    const onFocus = () => refresh({ silent: true });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh({ silent: true });
    }, 20_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const value = useMemo(
    () => ({ overview, loading: loading || authLoading, lastUpdated, autoRefreshing, refresh }),
    [overview, loading, authLoading, lastUpdated, autoRefreshing, refresh]
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData(): AdminDataContextValue {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData doit être utilisé à l'intérieur de <AdminDataProvider>");
  return ctx;
}

/** Point unique pour la redirection 401/403 sur les routes /api/admin/* —
 * un compte super_admin se connecte par email/mot de passe (pas de profil
 * vendeur), donc un 403 doit ramener à /admin/login et non à /dashboard. */
export function handleAdminAuthStatus(
  status: number,
  router: ReturnType<typeof useRouter>,
  redirectPath: string
): boolean {
  if (status === 401) {
    router.replace(`/admin/login?redirect=${encodeURIComponent(redirectPath)}`);
    return true;
  }
  if (status === 403) {
    router.replace("/admin/login?error=forbidden");
    return true;
  }
  return false;
}
