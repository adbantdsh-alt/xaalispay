"use client";

import type { AdminAlert, AdminTab } from "./admin-types";

export function AdminAlertsBar({
  alerts,
  onNavigate,
  onReconcile,
  onExpireStale,
  busy,
}: {
  alerts: AdminAlert[];
  onNavigate: (tab: AdminTab) => void;
  onReconcile?: () => void;
  onExpireStale?: () => void;
  busy?: boolean;
}) {
  if (alerts.length === 0) return null;

  const hasStale = alerts.some((a) => a.id === "stale-pending");
  const hasPending = alerts.some((a) => a.id === "pending-payments" || a.id === "stale-pending");

  return (
    <section className="admin-alerts" aria-label="Alertes opérationnelles">
      {alerts.map((alert) => (
        <article key={alert.id} className={`admin-alert admin-alert--${alert.severity}`}>
          <div className="admin-alert-body">
            <p className="admin-alert-title">{alert.title}</p>
            <p className="admin-alert-detail">{alert.detail}</p>
          </div>
          {alert.action && (
            <button
              type="button"
              className="admin-alert-action"
              onClick={() => onNavigate(alert.action!)}
            >
              Voir
            </button>
          )}
        </article>
      ))}
      {(hasPending || hasStale) && (onReconcile || onExpireStale) && (
        <div className="admin-alert-actions">
          {onReconcile && (
            <button type="button" className="admin-action-btn" disabled={busy} onClick={onReconcile}>
              {busy ? "Réconciliation…" : "Réconcilier Bictorys"}
            </button>
          )}
          {onExpireStale && hasStale && (
            <button type="button" className="admin-action-btn admin-action-btn--muted" disabled={busy} onClick={onExpireStale}>
              Expirer tests &gt; 6 h
            </button>
          )}
        </div>
      )}
    </section>
  );
}
