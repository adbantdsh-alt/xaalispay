"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { apiFetch, extractApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-client";
import { adaptTeamMemberRow } from "./admin-adapters";
import { handleAdminAuthStatus } from "./AdminDataProvider";
import { TEAM_ROLE_LABELS, type StaffRole, type TeamMemberRow } from "./admin-types";

export function AdminProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch("/api/admin/team");
    if (handleAdminAuthStatus(res.status, router, "/admin/profile")) return;
    if (res.ok) setMembers((await res.json()).map(adaptTeamMemberRow));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleCreated = (memberId: number) => {
    setShowCreateModal(false);
    router.push(`/admin/profile/team/${memberId}`);
  };

  if (loading && members.length === 0) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-section">
      <section className="admin-card">
        <div className="admin-profile-self">
          <span className="admin-seller-avatar" aria-hidden="true">
            {(user?.display_name || "?").charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="admin-modal-head-title">{user?.display_name}</p>
            <p className="admin-modal-head-subtitle admin-mono">{user?.email}</p>
            <span className="admin-badge neutral">
              {TEAM_ROLE_LABELS[user?.role as StaffRole] ?? user?.role}
            </span>
          </div>
        </div>
      </section>

      <section className="admin-card" style={{ marginTop: "1.25rem" }}>
        <div className="admin-section-head">
          <h2 className="admin-card-title" style={{ marginBottom: 0 }}>
            Équipe
          </h2>
          {isSuperAdmin && (
            <button type="button" className="admin-action-btn" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} aria-hidden="true" style={{ marginRight: "0.3rem", verticalAlign: "-2px" }} />
              Ajouter un membre
            </button>
          )}
        </div>

        {members.length === 0 ? (
          <p className="admin-empty">Aucun membre d&apos;équipe.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr
                    key={m.id}
                    className={isSuperAdmin ? "admin-row-click" : ""}
                    onClick={isSuperAdmin ? () => router.push(`/admin/profile/team/${m.id}`) : undefined}
                  >
                    <td>
                      <strong>{m.displayName}</strong>
                    </td>
                    <td className="admin-mono">{m.email}</td>
                    <td>{TEAM_ROLE_LABELS[m.role]}</td>
                    <td>
                      <span className={`admin-badge ${m.isActive ? "good" : "bad"}`}>
                        {m.isActive ? "Actif" : "Inactif"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showCreateModal && (
        <CreateTeamMemberModal onClose={() => setShowCreateModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}

function CreateTeamMemberModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (memberId: number) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("dispute_manager");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await apiFetch("/api/admin/team/create", {
      method: "POST",
      body: JSON.stringify({ display_name: displayName, email, role }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(extractApiError(data, "Création impossible"));
      return;
    }
    onCreated(data.id);
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <article className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <header className="admin-modal-head">
          <h2>Ajouter un membre</h2>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Fermer">
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="member-name">
              Nom complet
            </label>
            <input
              id="member-name"
              className="input-field input-compact"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="member-email">
              Email
            </label>
            <input
              id="member-email"
              type="email"
              className="input-field input-compact"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="member-role">
              Rôle
            </label>
            <select
              id="member-role"
              className="input-field input-compact"
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
            >
              <option value="super_admin">{TEAM_ROLE_LABELS.super_admin}</option>
              <option value="dispute_manager">{TEAM_ROLE_LABELS.dispute_manager}</option>
            </select>
          </div>
          {error && (
            <p className="alert-danger" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Création…" : "Créer le compte"}
          </button>
        </form>
      </article>
    </div>
  );
}
