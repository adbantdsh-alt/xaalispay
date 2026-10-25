"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, UserPlus } from "lucide-react";
import { apiFetch, extractApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-client";
import { adaptTeamMemberRow } from "./admin-adapters";
import { handleAdminAuthStatus } from "./AdminDataProvider";
import { TEAM_ROLE_LABELS, type StaffRole, type TeamMemberRow } from "./admin-types";
import { DetailPanel, EmptyState, EntityCell, Panel, StatusPill, initialsOf } from "./AdminUI";

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

  const roleLabel = TEAM_ROLE_LABELS[user?.role as StaffRole] ?? user?.role ?? "";

  return (
    <div className="admin-section">
      <section className="ax-profile">
        <span className="ax-avatar ax-avatar--lg" aria-hidden="true">
          {initialsOf(user?.display_name || "?")}
        </span>
        <div className="ax-profile-text">
          <h2 className="ax-profile-name">{user?.display_name}</h2>
          <span className="ax-muted admin-mono">{user?.email}</span>
        </div>
        <StatusPill tone="info" label={roleLabel} />
      </section>

      <Panel
        title="Équipe XaalisPay"
        count={members.length}
        actions={
          isSuperAdmin && (
            <button type="button" className="ax-btn ax-btn--primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} aria-hidden="true" />
              Ajouter un membre
            </button>
          )
        }
      >
        {members.length === 0 ? (
          <EmptyState icon={UserPlus} title="Aucun membre d'équipe" />
        ) : (
          <table className="ax-table">
            <thead>
              <tr>
                <th>Membre</th>
                <th>Rôle</th>
                <th>Statut</th>
                {isSuperAdmin && <th aria-label="Ouvrir" />}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr
                  key={m.id}
                  className={isSuperAdmin ? "ax-row" : undefined}
                  tabIndex={isSuperAdmin ? 0 : undefined}
                  onClick={isSuperAdmin ? () => router.push(`/admin/profile/team/${m.id}`) : undefined}
                  onKeyDown={
                    isSuperAdmin ? (e) => e.key === "Enter" && router.push(`/admin/profile/team/${m.id}`) : undefined
                  }
                >
                  <td>
                    <EntityCell name={m.displayName} sub={m.email} />
                  </td>
                  <td>{TEAM_ROLE_LABELS[m.role]}</td>
                  <td>
                    <StatusPill tone={m.isActive ? "good" : "neutral"} label={m.isActive ? "Actif" : "Inactif"} />
                  </td>
                  {isSuperAdmin && (
                    <td className="ax-chevron">
                      <ChevronRight size={16} aria-hidden="true" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

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
    <DetailPanel title="Ajouter un membre" subtitle="Un mot de passe temporaire lui sera attribué" onClose={onClose}>
      <form onSubmit={handleSubmit} className="ax-form">
        <label className="ax-field">
          <span>Nom complet</span>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </label>
        <label className="ax-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="ax-field">
          <span>Rôle</span>
          <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
            <option value="super_admin">{TEAM_ROLE_LABELS.super_admin}</option>
            <option value="dispute_manager">{TEAM_ROLE_LABELS.dispute_manager}</option>
          </select>
        </label>
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={saving} className="ax-btn ax-btn--primary ax-btn--block">
          {saving ? "Création…" : "Créer le compte"}
        </button>
      </form>
    </DetailPanel>
  );
}
