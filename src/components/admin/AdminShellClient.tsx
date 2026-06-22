"use client";

import { useEffect, useState } from "react";
import { AdminDataProvider } from "./AdminDataProvider";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

const COLLAPSE_STORAGE_KEY = "admin-sidebar-collapsed";

export function AdminShellClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1") setCollapsed(true);
  }, []);

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
