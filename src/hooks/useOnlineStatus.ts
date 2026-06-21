"use client";

import { useEffect, useState } from "react";

export function useOnlineStatus(): boolean {
  // Toujours "true" au premier rendu, identique au SSR (qui n'a pas accès à
  // navigator) — lire navigator.onLine dès l'état initial désynchronise
  // l'hydration Next.js si le navigateur est hors-ligne au chargement de la
  // page. La vraie valeur n'est lue qu'après montage, dans l'effet.
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
