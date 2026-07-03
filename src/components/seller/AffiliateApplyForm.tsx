"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, extractApiError } from "@/lib/api-client";

export function AffiliateApplyForm() {
  const router = useRouter();
  const [motivation, setMotivation] = useState("");
  const [channel, setChannel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await apiFetch("/api/affiliates/apply", {
      method: "POST",
      body: JSON.stringify({ motivation, channel }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(extractApiError(data, "Impossible d'envoyer la demande."));
      return;
    }
    router.replace("/settings/affiliates");
  };

  return (
    <form onSubmit={handleSubmit} className="field-block" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <section className="settings-profile-card">
        <p className="text-muted" style={{ fontSize: "0.8125rem", margin: 0 }}>
          Répondez aux deux questions ci-dessous. Notre équipe examinera votre demande et vous donnera
          une réponse dans les meilleurs délais.
        </p>

        <div className="settings-info-grid" style={{ gap: "1rem" }}>
          <div>
            <label className="settings-section-label" style={{ display: "block", paddingBottom: "0.4rem" }}>
              Pourquoi souhaitez-vous rejoindre le programme ?
            </label>
            <textarea
              className="input-field"
              rows={4}
              required
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="Décrivez votre motivation pour rejoindre le programme d'affiliation XaalisPay…"
              style={{ resize: "vertical" }}
            />
          </div>

          <div>
            <label className="settings-section-label" style={{ display: "block", paddingBottom: "0.4rem" }}>
              Comment comptez-vous promouvoir XaalisPay ?
            </label>
            <textarea
              className="input-field"
              rows={4}
              required
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="Réseaux sociaux, communauté en ligne, bouche à oreille…"
              style={{ resize: "vertical" }}
            />
          </div>
        </div>

        {error && <p className="field-error">{error}</p>}

        <button
          type="submit"
          className="btn-seller-primary"
          disabled={loading || !motivation.trim() || !channel.trim()}
          style={{ width: "100%" }}
        >
          {loading ? "Envoi…" : "Envoyer ma demande"}
        </button>
      </section>
    </form>
  );
}
