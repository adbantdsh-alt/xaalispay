"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePortalAuth } from "@/lib/connect-portal-auth";
import { PortalSidebar } from "./PortalSidebar";

const FORCE_CHANGE_PASSWORD_PATH = "/connect/portal/change-password";

export function PortalShellClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = usePortalAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Même ordre de garde-fous que AdminShellClient : pas de session → login ;
  // mot de passe encore temporaire → bloque tout sauf l'écran de changement.
  // Pas de notion de rôle ici (un seul type d'utilisateur portail).
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/connect/portal/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (user.must_change_password) {
      if (pathname !== FORCE_CHANGE_PASSWORD_PATH) router.replace(FORCE_CHANGE_PASSWORD_PATH);
      return;
    }
    if (pathname === FORCE_CHANGE_PASSWORD_PATH) {
      router.replace("/connect/portal");
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <PortalSidebar />
      <div className="admin-content-wrapper">
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
