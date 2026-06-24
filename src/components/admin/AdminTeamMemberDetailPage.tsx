"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { adaptTeamMemberDetail } from "./admin-adapters";
import { handleAdminAuthStatus } from "./AdminDataProvider";
import { TEAM_ROLE_LABELS, formatAdminDate, type TeamMemberDetail } from "./admin-types";

export function AdminTeamMemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [member, setMember] = useState<TeamMemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchMember = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await apiFetch(`/api/admin/team/${id}`);
    if (handleAdminAuthStatus(res.status, router, `/admin/profile/team/${id}`)) return;
    if (!res.ok) {
      setError("Membre introuvable.");
      setLoading(false);
      return;
    }
    setMember(adaptTeamMemberDetail(await res.json()));
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  const copyPassword = () => {
    if (!member?.tempPassword) return;
    navigator.clipboard.writeText(member.tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !member) {
    return <p className="admin-empty">{error || "Membre introuvable."}</p>;
  }

  return (
    <div className="admin-section" style={{ maxWidth: "36rem" }}>
      <article className="admin-card">
        <div className="admin-profile-self">
          <span className="admin-seller-avatar" aria-hidden="true">
            {member.displayName.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="admin-modal-head-title">{member.displayName}</p>
            <p className="admin-modal-head-subtitle admin-mono">{member.email}</p>
            <span className="admin-badge neutral">{TEAM_ROLE_LABELS[member.role]}</span>{" "}
            <span className={`admin-badge ${member.isActive ? "good" : "bad"}`}>
              {member.isActive ? "Actif" : "Inactif"}
            </span>
          </div>
        </div>
        <p className="admin-cell-sub" style={{ marginTop: "0.75rem" }}>
          Créé le {formatAdminDate(member.createdAt)}
        </p>
      </article>

      <article className="admin-card" style={{ marginTop: "1.25rem" }}>
        <h2 className="admin-card-title">Identifiants de connexion</h2>
        {member.mustChangePassword && member.tempPassword ? (
          <>
            <div className="admin-hint-banner">
              <span className="admin-hint-dot" aria-hidden="true" />
              <span className="admin-hint-muted">
                Cet utilisateur n&apos;a pas encore changé son mot de passe — voici les accès à lui
                transmettre. Ils disparaîtront dès son premier changement de mot de passe.
              </span>
            </div>
            <div className="admin-credential-box">
              <div className="admin-cell-sub">Email</div>
              <p className="admin-mono" style={{ margin: "0.15rem 0 0.75rem" }}>
                {member.email}
              </p>
              <div className="admin-cell-sub">Mot de passe temporaire</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginTop: "0.15rem" }}>
                <span className="admin-mono">{member.tempPassword}</span>
                <button type="button" className="admin-action-btn" onClick={copyPassword}>
                  <Copy size={13} aria-hidden="true" style={{ marginRight: "0.3rem", verticalAlign: "-2px" }} />
                  {copied ? "Copié !" : "Copier"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="admin-empty">
            Mot de passe déjà personnalisé par l&apos;utilisateur — ses identifiants ne sont plus
            consultables.
          </p>
        )}
      </article>
    </div>
  );
}
