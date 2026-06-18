"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Order, Profile } from "@/lib/types";

export interface SellerWalletSummary {
  available: number;
  sequestered: Array<{
    orderId: string;
    productName: string;
    amount: number;
    status: string;
    protectionEndsAt?: string;
  }>;
  sequesteredTotal?: number;
}

export interface SellerDashboardPayload {
  profile: Profile;
  wallet: SellerWalletSummary;
  orders: Order[];
  productCount?: number;
  protectionMinutes: number;
  canCreateProducts?: boolean;
  emailVerified?: boolean;
  isSuperAdmin?: boolean;
  hasSuccessfulPayout?: boolean;
}

interface SellerDataContextValue {
  data: SellerDashboardPayload | null;
  loading: boolean;
  refresh: (options?: { silent?: boolean }) => Promise<SellerDashboardPayload | null>;
}

const SellerDataContext = createContext<SellerDataContextValue | null>(null);

let inflightDashboard: Promise<SellerDashboardPayload | null> | null = null;

async function fetchDashboard(): Promise<SellerDashboardPayload | null> {
  if (inflightDashboard) return inflightDashboard;

  inflightDashboard = fetch("/api/dashboard")
    .then(async (res) => {
      if (res.status === 401) {
        window.location.href = "/auth";
        return null;
      }
      if (!res.ok) return null;
      return res.json();
    })
    .finally(() => {
      inflightDashboard = null;
    });

  return inflightDashboard;
}

function needsActivePolling(data: SellerDashboardPayload | null): boolean {
  if (!data) return true;
  const hasPendingOrders = data.orders.some(
    (o) => o.status === "pending_payment" || o.status === "paid"
  );
  const hasActiveProtection = data.wallet.sequestered.some(
    (s) =>
      s.status === "protection" &&
      s.protectionEndsAt &&
      new Date(s.protectionEndsAt).getTime() > Date.now()
  );
  return hasPendingOrders || hasActiveProtection;
}

export function SellerDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SellerDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFocusRefresh = useRef(0);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    const next = await fetchDashboard();
    if (next) setData(next);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    refresh({ silent: false });
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => {
      const now = Date.now();
      if (now - lastFocusRefresh.current < 30_000) return;
      lastFocusRefresh.current = now;
      refresh({ silent: true });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  useEffect(() => {
    const pollMs = needsActivePolling(data) ? 60_000 : 300_000;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refresh({ silent: true });
      }
    }, pollMs);

    return () => window.clearInterval(interval);
  }, [refresh, data]);

  const value = useMemo(
    () => ({ data, loading, refresh }),
    [data, loading, refresh]
  );

  return (
    <SellerDataContext.Provider value={value}>{children}</SellerDataContext.Provider>
  );
}

export function useSellerData() {
  const context = useContext(SellerDataContext);
  if (!context) {
    throw new Error("useSellerData must be used within SellerDataProvider");
  }
  return context;
}
