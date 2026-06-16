"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { AdminTab, OverviewData } from "./admin-types";

export function AdminOverviewSection({
  overview,
  onNavigate,
  onRefresh,
}: {
  overview: OverviewData;
  onNavigate: (tab: AdminTab) => void;
  onRefresh: () => void;
}) {
  const { stats, relational } = overview;
  const [migrating, setMigrating] = useState(false);
  const [migrateMsg, setMigrateMsg] = useState("");

  const runMigration = async () => {
    if (
      !window.confirm(
        "Copier app_state vers les tables relationnelles Supabase ?\n\nLa source de vérité reste app_state pour l'instant."
      )
    ) {
      return;
    }
    setMigrating(true);
    setMigrateMsg("");
    try {
      const res = await fetch("/api/admin/migrate-relational", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMigrateMsg(data.error || "Migration échouée");
        return;
      }
      const total = Object.values(data.counts as Record<string, number>).reduce(
        (sum, n) => sum + n,
        0
      );
      setMigrateMsg(`${total} enregistrement(s) synchronisé(s).`);
      onRefresh();
    } catch {
      setMigrateMsg("Erreur réseau");
    } finally {
      setMigrating(false);
    }
  };

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

      {relational && (
        <article className="admin-card">
          <h2 className="admin-card-title">Base relationnelle</h2>
          <ul className="admin-health-list">
            <li>
              <span>Schéma xp_*</span>
              <strong className={relational.schemaReady ? "admin-health-ok" : "admin-health-bad"}>
                {relational.schemaReady ? "Installé" : "Exécuter schema_v1.sql"}
              </strong>
            </li>
            {relational.lastMigratedAt && (
              <li>
                <span>Dernière sync</span>
                <strong>
                  {new Date(relational.lastMigratedAt).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>
              </li>
            )}
            {relational.lastMigratedAt && relational.counts.orders != null && (
              <li>
                <span>Commandes miroir</span>
                <strong>{relational.counts.orders}</strong>
              </li>
            )}
          </ul>
          {relational.schemaReady && (
            <button
              type="button"
              className="admin-action-btn admin-migrate-btn"
              disabled={migrating}
              onClick={runMigration}
            >
              {migrating ? "Synchronisation…" : "Synchroniser app_state → tables"}
            </button>
          )}
          {migrateMsg && <p className="admin-migrate-msg">{migrateMsg}</p>}
        </article>
      )}
    </section>
  );
}
