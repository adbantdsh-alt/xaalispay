"use client";

import { useEffect, useState } from "react";
import {
  formatSenegalPhoneDisplay,
} from "@/lib/utils";

export function SettingsPhoneEditor({
  phone,
  onSaved,
}: {
  phone?: string;
  onSaved: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!editing) {
      setValue(phone ? formatSenegalPhoneDisplay(phone) : "");
    }
  }, [phone, editing]);

  const openEditor = () => {
    setError("");
    setSuccess("");
    setValue(phone ? formatSenegalPhoneDisplay(phone) : "");
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError("");
    setValue(phone ? formatSenegalPhoneDisplay(phone) : "");
  };

  const save = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: value }),
    });

    const result = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(result.error || "Enregistrement impossible");
      return;
    }

    await onSaved();
    setEditing(false);
    setSuccess("Numéro mis à jour");
    setTimeout(() => setSuccess(""), 3000);
  };

  const displayPhone = phone
    ? `+221 ${formatSenegalPhoneDisplay(phone)}`
    : null;

  if (editing) {
    return (
      <div className="settings-phone-editor">
        <label className="settings-phone-editor-label" htmlFor="settings-phone-input">
          Numéro mobile
        </label>
        <div className="phone-input-row">
          <span className="phone-prefix">+221</span>
          <input
            id="settings-phone-input"
            className="input-field phone-input"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="77 123 45 67"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={saving}
          />
        </div>
        <p className="settings-phone-hint text-muted">
          Wave ou Orange Money — visible par vos clients sur vos pages de paiement.
        </p>
        {error && <p className="settings-phone-error">{error}</p>}
        <div className="settings-phone-actions">
          <button
            type="button"
            className="btn-secondary settings-phone-btn"
            onClick={cancel}
            disabled={saving}
          >
            Annuler
          </button>
          <button
            type="button"
            className="btn-seller-primary settings-phone-btn"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-info-grid settings-phone-grid">
      <div className="settings-info-row settings-info-row-phone">
        <span className="settings-phone-label">Téléphone</span>
        <div className="settings-phone-value-wrap">
          {displayPhone ? (
            <span className="settings-phone-value">{displayPhone}</span>
          ) : (
            <span className="settings-phone-empty text-muted">Non renseigné</span>
          )}
          <button type="button" className="settings-phone-edit" onClick={openEditor}>
            {phone ? "Modifier" : "Ajouter"}
          </button>
        </div>
        {success && <p className="settings-phone-success">{success}</p>}
      </div>
    </div>
  );
}
