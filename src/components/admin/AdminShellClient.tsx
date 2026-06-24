"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { AdminDataProvider } from "./AdminDataProvider";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

const COLLAPSE_STORAGE_KEY = "admin-sidebar-collapsed";

// Préfixes de route autorisés par rôle — un rôle absent de cette map a accès
// à tout (cas super_admin). "/admin/profile" doit rester atteignable par
// tout rôle staff (Mon profil).
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

  // Deux garde-fous, la première prioritaire sur la seconde : un mot de
  // passe encore temporaire bloque tout sauf l'écran de changement, quel
  // que soit le rôle ; une fois changé, le rôle détermine les sections
  // accessibles. Toujours une redirection, jamais une déconnexion — ne pas
  // confondre avec handleAdminAuthStatus, qui gère un 403 renvoyé par l'API.
  useEffect(() => {
    if (authLoading || !user) return;

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
