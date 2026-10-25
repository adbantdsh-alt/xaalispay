"use client";

import { Fragment, useState } from "react";
import { formatAdminDate, type AffiliateApplicationRow } from "./admin-types";
import { EntityCell, Panel } from "./AdminUI";

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
    <Panel title="Demandes d'affiliation en attente" count={applications.length}>
      <table className="ax-table">
        <thead>
          <tr>
            <th>Vendeur</th>
            <th>Motivation</th>
            <th>Canal</th>
            <th>Reçue le</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <Fragment key={app.id}>
              <tr>
                <td>
                  <EntityCell name={app.sellerBusinessName} sub={`@${app.sellerUsername}`} />
                </td>
                <td className="ax-cell-text">{app.motivation}</td>
                <td className="ax-cell-text">{app.channel}</td>
                <td className="is-nowrap is-muted">{formatAdminDate(app.createdAt)}</td>
                <td className="is-nowrap">
                  <span className="ax-inline-form">
                    <button
                      type="button"
                      className="ax-btn ax-btn--sm ax-btn--primary"
                      disabled={loadingId === app.id}
                      onClick={() => handleApprove(app.id)}
                    >
                      Approuver
                    </button>
                    <button
                      type="button"
                      className="ax-btn ax-btn--sm"
                      disabled={loadingId === app.id}
                      onClick={() => {
                        setRejectingId(app.id);
                        setAdminNote("");
                      }}
                    >
                      Rejeter
                    </button>
                  </span>
                </td>
              </tr>
              {rejectingId === app.id && (
                <tr className="ax-row-form">
                  <td colSpan={5}>
                    <span className="ax-inline-form ax-inline-form--full">
                      <label className="ax-sr-only" htmlFor={`reject-note-${app.id}`}>
                        Note pour le vendeur
                      </label>
                      <input
                        id={`reject-note-${app.id}`}
                        type="text"
                        className="ax-input ax-input--grow"
                        placeholder="Note pour le vendeur (optionnel)…"
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="ax-btn ax-btn--sm ax-btn--primary"
                        disabled={loadingId === app.id}
                        onClick={() => handleRejectSubmit(app.id)}
                      >
                        Confirmer le rejet
                      </button>
                      <button type="button" className="ax-btn ax-btn--sm" onClick={() => setRejectingId(null)}>
                        Annuler
                      </button>
                    </span>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
