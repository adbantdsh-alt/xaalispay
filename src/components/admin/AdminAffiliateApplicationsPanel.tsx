"use client";

import { Fragment, useState } from "react";
import { formatAdminDate, type AffiliateApplicationRow } from "./admin-types";

export function AdminAffiliateApplicationsPanel({
  applications,
  onApprove,
  onReject,
}: {
  applications: AffiliateApplicationRow[];
  onApprove: (id: number) => Promise<boolean>;
  onReject: (id: number, adminNote: string) => Promise<boolean>;
}) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const handleApprove = async (id: number) => {
    setLoadingId(id);
    await onApprove(id);
    setLoadingId(null);
  };

  const handleRejectSubmit = async (id: number) => {
    setLoadingId(id);
    const ok = await onReject(id, adminNote);
    setLoadingId(null);
    if (ok) {
      setRejectingId(null);
      setAdminNote("");
    }
  };

  return (
    <section className="admin-section" style={{ marginBottom: "1.5rem" }}>
      <div className="admin-section-head" style={{ marginBottom: "0.75rem" }}>
        <p className="admin-kpi-label" style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
          Demandes d&apos;affiliation en attente{" "}
          <span className="admin-badge neutral">{applications.length}</span>
        </p>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Vendeur</th>
              <th>Motivation</th>
              <th>Canal</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <Fragment key={app.id}>
                <tr>
                  <td>
                    <strong>{app.sellerBusinessName}</strong>
                    <span className="admin-cell-sub admin-mono">@{app.sellerUsername}</span>
                  </td>
                  <td style={{ maxWidth: 280, whiteSpace: "pre-wrap" }}>{app.motivation}</td>
                  <td style={{ maxWidth: 200, whiteSpace: "pre-wrap" }}>{app.channel}</td>
                  <td className="admin-mono admin-cell-nowrap">{formatAdminDate(app.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="admin-action-btn"
                        disabled={loadingId === app.id}
                        onClick={() => handleApprove(app.id)}
                      >
                        Approuver
                      </button>
                      <button
                        type="button"
                        className="admin-action-btn admin-action-btn--warn"
                        disabled={loadingId === app.id}
                        onClick={() => {
                          setRejectingId(app.id);
                          setAdminNote("");
                        }}
                      >
                        Rejeter
                      </button>
                    </div>
                  </td>
                </tr>
                {rejectingId === app.id && (
                  <tr>
                    <td colSpan={5} style={{ background: "#fef2f2", paddingTop: "0.5rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                        <input
                          type="text"
                          className="input-field input-compact"
                          placeholder="Note pour le vendeur (optionnel)…"
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          style={{ flex: 1 }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="admin-action-btn admin-action-btn--warn"
                          disabled={loadingId === app.id}
                          onClick={() => handleRejectSubmit(app.id)}
                        >
                          Confirmer
                        </button>
                        <button
                          type="button"
                          className="admin-action-btn"
                          onClick={() => setRejectingId(null)}
                        >
                          Annuler
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
