"use client";

import { useState } from "react";

export function SettingsNotificationPrefs() {
  const [status, setStatus] = useState<string>("");

  const enableBrowser = async () => {
    setStatus("");
    if (typeof Notification === "undefined") {
      setStatus("Notifications non supportées sur cet appareil.");
      return;
    }
    if (Notification.permission === "granted") {
      setStatus("Notifications déjà activées.");
      return;
    }
    const result = await Notification.requestPermission();
    if (result === "granted") {
      setStatus("Notifications activées — vous serez alerté des nouvelles commandes.");
    } else if (result === "denied") {
      setStatus("Refusé — autorisez les notifications dans les paramètres du navigateur.");
    } else {
      setStatus("Autorisation en attente.");
    }
  };

  return (
    <div className="settings-notify-prefs">
      <p className="settings-section-label">Notifications</p>
      <p className="settings-notify-desc text-muted">
        Recevez une alerte navigateur quand une nouvelle commande est payée (en plus du toast
        dans l&apos;app).
      </p>
      <button type="button" className="btn-secondary settings-notify-btn" onClick={enableBrowser}>
        Activer les notifications navigateur
      </button>
      {status && <p className="settings-notify-status">{status}</p>}
    </div>
  );
}
