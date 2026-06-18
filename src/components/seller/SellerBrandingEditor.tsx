"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { uploadProductImageFile } from "@/lib/product-form";
import { resolveProfileImageUrl } from "@/lib/profile-images";
import { buildShopPath } from "@/lib/site-url";

interface SellerBrandingEditorProps {
  profile: Profile;
  onUpdated?: () => void | Promise<void>;
}

export function SellerBrandingEditor({ profile, onUpdated }: SellerBrandingEditorProps) {
  const [avatarUrl, setAvatarUrl] = useState(resolveProfileImageUrl(profile.avatarUrl));
  const [coverUrl, setCoverUrl] = useState(resolveProfileImageUrl(profile.coverUrl));
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const initial = profile.displayName.charAt(0).toUpperCase();

  const saveBranding = async (patch: { avatarUrl?: string | null; coverUrl?: string | null }) => {
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Enregistrement impossible");
    }
    if (data.profile?.avatarUrl !== undefined) {
      setAvatarUrl(resolveProfileImageUrl(data.profile.avatarUrl));
    }
    if (data.profile?.coverUrl !== undefined) {
      setCoverUrl(resolveProfileImageUrl(data.profile.coverUrl));
    }
    await onUpdated?.();
  };

  const handleUpload = async (kind: "avatar" | "cover", file: File | null) => {
    if (!file) return;
    setError("");
    setSuccess("");
    setUploading(kind);
    try {
      const url = await uploadProductImageFile(file);
      await saveBranding(kind === "avatar" ? { avatarUrl: url } : { coverUrl: url });
      setSuccess(kind === "avatar" ? "Photo de profil mise à jour" : "Bannière mise à jour");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload échoué");
    } finally {
      setUploading(null);
    }
  };

  const removeImage = async (kind: "avatar" | "cover") => {
    setError("");
    setSuccess("");
    setUploading(kind);
    try {
      await saveBranding(kind === "avatar" ? { avatarUrl: "" } : { coverUrl: "" });
      if (kind === "avatar") setAvatarUrl("");
      else setCoverUrl("");
      setSuccess(kind === "avatar" ? "Photo de profil retirée" : "Bannière retirée");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setUploading(null);
    }
  };

  return (
    <section className="branding-editor">
      <div className="branding-editor-head">
        <div>
          <h2 className="branding-editor-title">Identité de marque</h2>
          <p className="branding-editor-desc text-muted">
            Visible sur votre boutique et vos liens de paiement.
          </p>
        </div>
        <Link href={buildShopPath(profile.username)} className="branding-editor-preview-link">
          Aperçu boutique
        </Link>
      </div>

      <div className="branding-editor-stage">
        <button
          type="button"
          className="branding-editor-cover-btn"
          onClick={() => coverInputRef.current?.click()}
          disabled={uploading === "cover"}
          aria-label="Changer la bannière"
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="branding-editor-cover-img" />
          ) : (
            <span className="branding-editor-cover-placeholder">
              {uploading === "cover" ? "Envoi…" : "+ Bannière de couverture"}
            </span>
          )}
        </button>

        <div className="branding-editor-avatar-wrap">
          <button
            type="button"
            className="branding-editor-avatar-btn"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploading === "avatar"}
            aria-label="Changer la photo de profil"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="branding-editor-avatar-img" />
            ) : (
              <span className="branding-editor-avatar-letter">{initial}</span>
            )}
          </button>
          <div className="branding-editor-avatar-actions">
            <button
              type="button"
              className="branding-editor-text-btn"
              onClick={() => avatarInputRef.current?.click()}
              disabled={!!uploading}
            >
              Photo profil
            </button>
            {avatarUrl && (
              <button
                type="button"
                className="branding-editor-text-btn branding-editor-text-btn-muted"
                onClick={() => removeImage("avatar")}
                disabled={!!uploading}
              >
                Retirer
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="branding-editor-actions">
        <button
          type="button"
          className="btn-seller-secondary btn-compact"
          onClick={() => coverInputRef.current?.click()}
          disabled={!!uploading}
        >
          {uploading === "cover" ? "Envoi…" : "Changer la bannière"}
        </button>
        {coverUrl && (
          <button
            type="button"
            className="branding-editor-text-btn branding-editor-text-btn-muted"
            onClick={() => removeImage("cover")}
            disabled={!!uploading}
          >
            Retirer la bannière
          </button>
        )}
      </div>

      {error && <p className="alert-danger">{error}</p>}
      {success && (
        <p className="toast-success" role="status">
          {success}
        </p>
      )}

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="sr-only-input"
        onChange={(e) => {
          void handleUpload("avatar", e.target.files?.[0] || null);
          e.target.value = "";
        }}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="sr-only-input"
        onChange={(e) => {
          void handleUpload("cover", e.target.files?.[0] || null);
          e.target.value = "";
        }}
      />
    </section>
  );
}
