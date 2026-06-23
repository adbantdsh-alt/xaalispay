"use client";

import { useState } from "react";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

export function SettingsNotificationPrefs() {
  const [status, setStatus] = useState<string>("");
  const [granted, setGranted] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );

  const handleToggle = async () => {
    setStatus("");
    if (typeof Notification === "undefined") {
      setStatus("Notifications non supportées sur cet appareil.");
      return;
    }
    if (Notification.permission === "granted") {
      setStatus("Déjà activées — désactivez-les depuis les réglages de votre navigateur.");
      return;
    }
    const result = await Notification.requestPermission();
    setGranted(result === "granted");
    if (result === "denied") {
      setStatus("Refusé — autorisez les notifications dans les paramètres du navigateur.");
    }
  };

  return (
    <div className="settings-notify-prefs">
      <div className="settings-notify-row">
        <div className="settings-notify-row-body">
          <p className="settings-notify-row-title">Alertes navigateur</p>
          <p className="settings-notify-row-desc text-muted">
            Quand une commande est payée ou livrée.
          </p>
        </div>
        <ToggleSwitch checked={granted} onClick={handleToggle} label="Alertes navigateur" />
      </div>
      {status && <p className="settings-notify-status">{status}</p>}
    </div>
  );
}
