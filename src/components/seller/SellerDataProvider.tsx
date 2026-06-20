"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Order, Profile } from "@/lib/types";
import { adaptOrder, adaptProfile, adaptWallet } from "@/lib/api-adapters";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-client";

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
  protectionMinutes: number;
  isSuperAdmin?: boolean;
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

  inflightDashboard = (async () => {
    const [profileRes, walletRes, ordersRes] = await Promise.all([
      apiFetch("/api/auth/me"),
      apiFetch("/api/orders/wallet"),
      apiFetch("/api/orders/mine"),
    ]);

    if (profileRes.status === 401 || walletRes.status === 401 || ordersRes.status === 401) {
      window.location.href = "/auth";
      return null;
    }
    if (!profileRes.ok || !walletRes.ok || !ordersRes.ok) return null;

    const [profileJson, walletJson, ordersJson] = await Promise.all([
      profileRes.json(),
      walletRes.json(),
      ordersRes.json(),
    ]);

    const wallet = adaptWallet(walletJson);

    return {
      profile: adaptProfile(profileJson),
      wallet: {
        available: wallet.available,
        sequestered: wallet.sequestered,
        sequesteredTotal: wallet.sequesteredTotal,
      },
      orders: (ordersJson as Array<Record<string, unknown>>).map(adaptOrder),
      protectionMinutes: walletJson.protection_minutes ?? 30,
      isSuperAdmin: profileJson.role === "super_admin",
    };
  })().finally(() => {
    inflightDashboard = null;
  });

  return inflightDashboard;
}

export function SellerDataProvider({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth();
  const [data, setData] = useState<SellerDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    const next = await fetchDashboard();
    if (next) setData(next);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    // Attendre que AuthProvider ait fini sa tentative de session silencieuse
    // (sinon le tout premier appel part sans token, ce qui marche grâce au
    // retry-après-401 de apiFetch mais fait un aller-retour réseau inutile).
    if (authLoading) return;
    refresh({ silent: false });
  }, [authLoading, refresh]);

  useEffect(() => {
    const onFocus = () => {
      refresh({ silent: true });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refresh({ silent: true });
      }
    }, 45_000);

    return () => window.clearInterval(interval);
  }, [refresh]);

  const value = useMemo(
    () => ({ data, loading: loading || authLoading, refresh }),
    [data, loading, authLoading, refresh]
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
