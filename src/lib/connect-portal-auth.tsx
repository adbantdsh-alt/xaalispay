"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { extractApiError } from "./api-client";
import {
  getPortalApiAccessToken,
  portalApiFetch,
  refreshPortalAccessToken,
  setPortalApiAccessToken,
} from "./connect-portal-api-client";

export interface PortalUser {
  id: string;
  email: string;
  display_name: string;
  must_change_password: boolean;
  platform_id: string;
  platform_name: string;
  platform_slug: string;
}

interface PortalAuthResult {
  ok: boolean;
  error?: string;
}

interface PortalAuthContextValue {
  user: PortalUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<PortalAuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextValue | null>(null);

async function fetchMe(): Promise<PortalUser | null> {
  const res = await portalApiFetch("/api/v1/connect/portal/me");
  if (!res.ok) return null;
  return res.json();
}

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    (async () => {
      try {
        const token = await refreshPortalAccessToken();
        if (!token) return;
        const me = await fetchMe();
        if (me) setUser(me);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<PortalAuthResult> => {
    const res = await fetch("/api/connect-portal/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: extractApiError(data, "Connexion échouée") };
    }
    setPortalApiAccessToken(data.access);
    setUser(data.user);
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/connect-portal/auth/logout", { method: "POST" }).catch(() => {});
    setPortalApiAccessToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getPortalApiAccessToken()) return;
    const me = await fetchMe();
    if (me) setUser(me);
  }, []);

  return (
    <PortalAuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth(): PortalAuthContextValue {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error("usePortalAuth doit être utilisé à l'intérieur de <PortalAuthProvider>");
  return ctx;
}
