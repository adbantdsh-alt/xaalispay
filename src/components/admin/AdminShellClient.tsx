"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { AdminDataProvider } from "./AdminDataProvider";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

const COLLAPSE_STORAGE_KEY = "admin-sidebar-collapsed";

// Rôles autorisés à entrer dans le portail admin, tout court — un compte
// vendeur qui atterrit sur /admin (ex. ancien lien, manipulation d'URL) doit
// être renvoyé vers son espace, jamais voir la coquille admin même sans
// données réelles (celles-ci sont déjà bloquées côté backend, mais la
// coquille elle-même ne doit jamais s'afficher pour un non-staff).
const STAFF_ROLES = ["super_admin", "dispute_manager"];

// Préfixes de route autorisés par rôle staff — un rôle staff absent de cette
// map a accès à tout (cas super_admin). "/admin/profile" doit rester
// atteignable par tout rôle staff (Mon profil).
const ALLOWED_PATH_PREFIXES_BY_ROLE: Record<string, string[]> = {
  dispute_manager: ["/admin/disputes", "/admin/profile"],
};
const FORCE_CHANGE_PASSWORD_PATH = "/admin/change-password";

export function AdminShellClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1") setCollapsed(true);
  }, []);

  // Plusieurs garde-fous, dans l'ordre de priorité : pas de session valide →
  // login ; pas un rôle staff → renvoyé vers son espace (jamais la coquille
  // admin, même sans données réelles) ; mot de passe encore temporaire →
  // bloque tout sauf l'écran de changement ; sinon le rôle détermine les
  // sections accessibles. Toujours une redirection, jamais une déconnexion —
  // ne pas confondre avec handleAdminAuthStatus, qui gère un 403 renvoyé
  // après coup par l'API (ce garde-fou-ci agit avant même le premier appel).
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!STAFF_ROLES.includes(user.role)) {
      router.replace("/dashboard");
      return;
    }
    if (user.must_change_password) {
      if (pathname !== FORCE_CHANGE_PASSWORD_PATH) router.replace(FORCE_CHANGE_PASSWORD_PATH);
      return;
    }
    if (pathname === FORCE_CHANGE_PASSWORD_PATH) {
      router.replace(user.role === "dispute_manager" ? "/admin/disputes" : "/admin");
      return;
    }
    const allowed = ALLOWED_PATH_PREFIXES_BY_ROLE[user.role];
    if (allowed && !allowed.some((prefix) => pathname.startsWith(prefix))) {
      router.replace("/admin/disputes");
    }
  }, [authLoading, user, pathname, router]);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, v ? "0" : "1");
      return !v;
    });
  };

  // Le tiroir mobile doit toujours s'afficher déplié, même si le repli
  // desktop était actif avant de réduire la fenêtre.
  const effectiveCollapsed = collapsed && !sidebarOpen;

  return (
    <AdminDataProvider>
      <div className={`admin-shell ${effectiveCollapsed ? "is-sidebar-collapsed" : ""}`}>
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={effectiveCollapsed}
          onToggleCollapsed={toggleCollapsed}
        />
        <div className="admin-content-wrapper">
          <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="admin-main">{children}</main>
        </div>
      </div>
    </AdminDataProvider>
  );
}
