"use client";

import { useEffect, useState } from "react";
import { MobileBottomNav } from "./MobileBottomNav";
import { SellerHeader } from "./seller/SellerHeader";
import { SellerSidebar } from "./seller/SellerSidebar";
import { SellerDesktopTopbar } from "./seller/SellerDesktopTopbar";
import { SellerDataProvider } from "./seller/SellerDataProvider";
import { SellerOrderNotifier } from "./seller/SellerOrderNotifier";
import { OfflineBanner } from "./ui/OfflineBanner";

const COLLAPSE_KEY = "seller-sidebar-collapsed";

export function SellerShellClient({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      localStorage.setItem(COLLAPSE_KEY, v ? "0" : "1");
      return !v;
    });
  };

  return (
    <SellerDataProvider>
      <SellerOrderNotifier />
      <div className={`seller-app seller-desktop-shell ${collapsed ? "is-sidebar-collapsed" : ""}`}>
        {/* Sidebar — cachée sur mobile via CSS, visible sur desktop */}
        <SellerSidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        {/* Colonne de contenu (englobe aussi la nav mobile pour éviter les orphelins dans le grid) */}
        <div className="seller-desktop-content-wrapper">
          <OfflineBanner />
          {/* Header mobile — visible sur mobile, caché sur desktop via CSS */}
          <header className="seller-mobile-header">
            <SellerHeader />
          </header>
          {/* Topbar desktop — cachée sur mobile via CSS */}
          <SellerDesktopTopbar />
          <main className="seller-desktop-main">{children}</main>
          {/* Bottom nav : position:fixed — le parent DOM n'a pas d'impact visuel, mais évite un orphelin dans le grid desktop */}
          <MobileBottomNav />
        </div>
      </div>
    </SellerDataProvider>
  );
}
