"use client";

import { useState } from "react";

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

    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name, businessName: shop }),
    });
    const result = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(result.error || "Enregistrement impossible");
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
        <label className="field-block">
          <span className="field-block-label">Nom affiché</span>
          <input
            className="input-field input-compact"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            disabled={saving}
          />
        </label>
        <label className="field-block">
          <span className="field-block-label">Nom de la boutique</span>
          <input
            className="input-field input-compact"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            maxLength={80}
            disabled={saving}
          />
        </label>
        {error && <p className="settings-phone-error">{error}</p>}
        <div className="settings-phone-actions">
          <button type="button" className="btn-secondary settings-phone-btn" onClick={cancel} disabled={saving}>
            Annuler
          </button>
          <button type="button" className="btn-seller-primary settings-phone-btn" onClick={save} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-info-grid settings-phone-grid">
      <div className="settings-info-row settings-info-row-phone">
        <span className="settings-phone-label">Nom</span>
        <div className="settings-phone-value-wrap">
          <span className="settings-phone-value">{displayName}</span>
          <button type="button" className="settings-phone-edit" onClick={open}>
            Modifier
          </button>
        </div>
      </div>
      <div className="settings-info-row settings-info-row-phone">
        <span className="settings-phone-label">Boutique</span>
        <div className="settings-phone-value-wrap">
          <span className="settings-phone-value">{businessName}</span>
          <button type="button" className="settings-phone-edit" onClick={open}>
            Modifier
          </button>
        </div>
      </div>
      {success && <p className="settings-phone-success">{success}</p>}
    </div>
  );
}
