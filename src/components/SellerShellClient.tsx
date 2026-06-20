"use client";

import { MobileBottomNav } from "./MobileBottomNav";
import { SellerHeader } from "./seller/SellerHeader";
import { SellerDataProvider } from "./seller/SellerDataProvider";
import { SellerOrderNotifier } from "./seller/SellerOrderNotifier";
import { OfflineBanner } from "./ui/OfflineBanner";

export function SellerShellClient({ children }: { children: React.ReactNode }) {
  return (
    <SellerDataProvider>
      <SellerOrderNotifier />
      <div className="seller-app seller-shell">
        <OfflineBanner />
        <header className="seller-shell-header">
          <SellerHeader />
        </header>
        <main className="seller-content">{children}</main>
        <MobileBottomNav />
      </div>
    </SellerDataProvider>
  );
}
