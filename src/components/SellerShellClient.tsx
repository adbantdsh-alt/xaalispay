"use client";

import { useState } from "react";
import { MobileBottomNav } from "./MobileBottomNav";
import { SellerHeader } from "./seller/SellerHeader";
import { ProfileSheet, type ProfileSheetData } from "./seller/ProfileSheet";
import { SettingsSheet } from "./seller/SettingsSheet";
import { SellerDataProvider, useSellerData } from "./seller/SellerDataProvider";

function SellerShellInner({ children }: { children: React.ReactNode }) {
  const { data: dashboard } = useSellerData();
  const profile = dashboard?.profile ?? null;
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  };

  return (
    <div className="seller-app seller-shell">
      <header className="seller-shell-header">
        <SellerHeader
          displayName={profile?.displayName || "…"}
          onProfileClick={() => {
            setSettingsOpen(false);
            setProfileOpen(true);
          }}
          onSettingsClick={() => {
            setProfileOpen(false);
            setSettingsOpen(true);
          }}
        />
      </header>
      <main className="seller-content">{children}</main>
      <MobileBottomNav />
      <ProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
      />
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={logout}
        showAdmin={dashboard?.profile?.role === "super_admin"}
      />
    </div>
  );
}

export function SellerShellClient({ children }: { children: React.ReactNode }) {
  return (
    <SellerDataProvider>
      <SellerShellInner>{children}</SellerShellInner>
    </SellerDataProvider>
  );
}
