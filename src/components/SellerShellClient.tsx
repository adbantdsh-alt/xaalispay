"use client";

import { useEffect, useState } from "react";
import { MobileBottomNav } from "./MobileBottomNav";
import { SellerHeader } from "./seller/SellerHeader";
import { ProfileSheet, type ProfileSheetData } from "./seller/ProfileSheet";
import { SettingsSheet } from "./seller/SettingsSheet";

export function SellerShellClient({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ProfileSheetData | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      })
      .catch(() => {});
  }, []);

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
      />
    </div>
  );
}
