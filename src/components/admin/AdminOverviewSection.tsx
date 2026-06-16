"use client";

import { formatCurrency } from "@/lib/utils";
import type { AdminTab, OverviewData } from "./admin-types";

export function AdminOverviewSection({
  overview,
  onNavigate,
}: {
  overview: OverviewData;
  onNavigate: (tab: AdminTab) => void;
}) {
  const { stats } = overview;

  return (
    <section className="admin-section">
      <div className="admin-kpi-grid admin-kpi-grid--compact">
        <button type="button" className="admin-kpi admin-kpi--action" onClick={() => onNavigate("disputes")}>
          <p className="admin-kpi-label">Litiges ouverts</p>
          <p className={`admin-kpi-value${stats.openDisputes > 0 ? " admin-kpi-value--alert" : ""}`}>
            {stats.openDisputes}
          </p>
          <p className="admin-kpi-sub">Arbitrer →</p>
        </button>
        <button type="button" className="admin-kpi admin-kpi--action" onClick={() => onNavigate("payouts")}>
          <p className="admin-kpi-label">Retraits</p>
          <p className="admin-kpi-value">
            {stats.pendingPayouts}
            {stats.failedPayouts > 0 && (
              <span className="admin-kpi-failed"> / {stats.failedPayouts} échoué(s)</span>
            )}
          </p>
          <p className="admin-kpi-sub">Gérer →</p>
        </button>
        <article className="admin-kpi">
          <p className="admin-kpi-label">GMV aujourd&apos;hui</p>
          <p className="admin-kpi-value">{formatCurrency(stats.gmvToday)}</p>
          <p className="admin-kpi-sub">{stats.paidTodayCount} commande(s)</p>
        </article>
      </div>

      <article className="admin-card">
        <h2 className="admin-card-title">Santé système</h2>
        <ul className="admin-health-list">
          <li>
            <span>Déploiement</span>
            <strong>{overview.health.commit || "local"}</strong>
          </li>
          <li>
            <span>Supabase</span>
            <strong>{overview.health.remoteOk ? "OK" : "Erreur"}</strong>
          </li>
          <li>
            <span>Retraits Bictorys</span>
            <strong>{overview.health.payoutConfigured ? "Configuré" : "Manquant"}</strong>
          </li>
          <li>
            <span>API Bictorys</span>
            <strong
              className={
                overview.health.bictorysBaseUrl?.includes("test")
                  ? "admin-health-bad"
                  : "admin-health-ok"
              }
            >
              {overview.health.bictorysBaseUrl?.includes("test") ? "TEST" : "PROD"}
              {" · "}
              {overview.health.bictorysBaseUrl}
            </strong>
          </li>
          <li>
            <span>Webhook secret</span>
            <strong className={overview.health.webhookSecretSet ? "admin-health-ok" : "admin-health-bad"}>
              {overview.health.webhookSecretSet ? "OK" : "Manquant"}
            </strong>
          </li>
        </ul>
      </article>

      {overview.prodConfig && (
        <article className="admin-card">
          <h2 className="admin-card-title">
            Checklist production
            {overview.prodConfig.ready ? (
              <span className="admin-health-ok admin-card-title-tag">— Prêt</span>
            ) : (
              <span className="admin-health-bad admin-card-title-tag">
                — {overview.prodConfig.missingCount} manquant(s)
              </span>
            )}
          </h2>
          <ul className="admin-health-list">
            {overview.prodConfig.checks
              .filter((check) => check.required || !check.ok)
              .map((check) => (
                <li key={check.id}>
                  <span>{check.label}</span>
                  <strong className={check.ok ? "admin-health-ok" : "admin-health-bad"}>
                    {check.ok ? "OK" : "Manquant"}
                  </strong>
                </li>
              ))}
          </ul>
        </article>
      )}
    </section>
  );
}
