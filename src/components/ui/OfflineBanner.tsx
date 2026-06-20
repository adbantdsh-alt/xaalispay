"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <p className="offline-banner" role="status">
      Hors connexion — certaines actions peuvent échouer
    </p>
  );
}
