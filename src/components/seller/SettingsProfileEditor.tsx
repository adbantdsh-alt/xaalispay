"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { apiFetch, extractApiError } from "@/lib/api-client";

export function SettingsProfileEditor({
  displayName,
  businessName,
  onSaved,
}: {
  displayName: string;
  businessName: string;
  onSaved: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(displayName);
  const [shop, setShop] = useState(businessName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const open = () => {
    setName(displayName);
    setShop(businessName);
    setError("");
    setSuccess("");
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setName(displayName);
    setShop(businessName);
  };

  const save = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    const res = await apiFetch("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ display_name: name, business_name: shop }),
    });
    const result = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(extractApiError(result, "Enregistrement impossible"));
      return;
    }

    await onSaved();
    setEditing(false);
    setSuccess("Profil mis à jour");
    setTimeout(() => setSuccess(""), 3000);
  };

  if (editing) {
    return (
      <div className="settings-profile-editor">
        <label className="settings-edit-field">
          <span className="settings-edit-label">Nom affiché</span>
          <input
            className="settings-edit-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            disabled={saving}
          />
        </label>
        <label className="settings-edit-field">
          <span className="settings-edit-label">Nom de la boutique</span>
          <input
            className="settings-edit-input"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            maxLength={80}
            disabled={saving}
          />
        </label>
        {error && <p className="settings-phone-error">{error}</p>}
        <div className="settings-edit-actions">
          <button type="button" className="settings-edit-btn settings-edit-btn-ghost" onClick={cancel} disabled={saving}>
            Annuler
          </button>
          <button type="button" className="settings-edit-btn settings-edit-btn-primary" onClick={save} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="settings-info-row">
        <span className="settings-phone-label">Nom</span>
        <div className="settings-phone-value-wrap">
          <span className="settings-phone-value">{displayName}</span>
          <button type="button" className="settings-row-edit-btn" onClick={open} aria-label="Modifier le nom">
            <Pencil size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>
      <div className="settings-info-row">
        <span className="settings-phone-label">Boutique</span>
        <div className="settings-phone-value-wrap">
          <span className="settings-phone-value">{businessName}</span>
          <button type="button" className="settings-row-edit-btn" onClick={open} aria-label="Modifier la boutique">
            <Pencil size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>
      {success && <p className="settings-phone-success">{success}</p>}
    </>
  );
}
