"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { AdminLaunchChecklist } from "./AdminLaunchChecklist";
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
        "Copier app_state vers les tables relationnelles Supabase ?\n\nEn production, la sync auto (dual-write) s'exécute aussi après chaque écriture."
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
      <details className="admin-tech-details">
        <summary className="admin-tech-summary">Paramètres techniques & lancement pilote</summary>
        <AdminLaunchChecklist />
      </details>

      <div className="admin-kpi-grid admin-kpi-grid--compact">
        <button type="button" className="admin-kpi admin-kpi--action" onClick={() => onNavigate("orders")}>
          <p className="admin-kpi-label">Paiements en attente</p>
          <p className={`admin-kpi-value${(overview.bictorys?.pendingPayments || 0) > 0 ? " admin-kpi-value--alert" : ""}`}>
            {overview.bictorys?.pendingPayments || 0}
          </p>
          <p className="admin-kpi-sub">Commandes →</p>
        </button>
        <button type="button" className="admin-kpi admin-kpi--action" onClick={() => onNavigate("vendors")}>
          <p className="admin-kpi-label">Vendeurs</p>
          <p className="admin-kpi-value">{stats.sellerCount}</p>
          <p className="admin-kpi-sub">Gérer →</p>
        </button>
        <button type="button" className="admin-kpi admin-kpi--action" onClick={() => onNavigate("pilote")}>
          <p className="admin-kpi-label">Pilote</p>
          <p className="admin-kpi-value">{stats.sellerCount}</p>
          <p className="admin-kpi-sub">Entonnoir →</p>
        </button>
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
          <li>
            <span>Dual-write xp_*</span>
            <strong className={overview.health.relationalDualWrite ? "admin-health-ok" : ""}>
              {overview.health.relationalDualWrite ? "Actif" : "Désactivé"}
            </strong>
          </li>
          <li>
            <span>Emails transactionnels</span>
            <strong className={overview.health.emailConfigured ? "admin-health-ok" : ""}>
              {overview.health.emailConfigured ? "Resend OK" : "Non configuré"}
            </strong>
          </li>
        </ul>
      </article>

      {overview.bictorys && (
        <article className="admin-card">
          <h2 className="admin-card-title">
            Bictorys — monitoring
            {overview.bictorys.webhooksFailed24h > 0 && (
              <span className="admin-health-bad admin-card-title-tag">
                — {overview.bictorys.webhooksFailed24h} échec(s) 24h
              </span>
            )}
          </h2>
          <ul className="admin-health-list">
            <li>
              <span>Webhooks (24h)</span>
              <strong>{overview.bictorys.webhooks24h}</strong>
            </li>
            <li>
              <span>Paiements en attente</span>
              <strong className={overview.bictorys.pendingPayments > 0 ? "admin-health-bad" : ""}>
                {overview.bictorys.pendingPayments}
              </strong>
            </li>
          </ul>
          {overview.bictorys.recentWebhooks.length > 0 && (
            <ul className="admin-webhook-list">
              {overview.bictorys.recentWebhooks.map((event) => (
                <li key={event.id}>
                  <span className={`admin-webhook-status admin-webhook-status--${event.status}`}>
                    {event.status}
                  </span>
                  <span className="admin-webhook-ref">{event.reference}</span>
                  <span className="admin-webhook-date">
                    {new Date(event.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      )}

      <article className="admin-card">
        <h2 className="admin-card-title">Exports CSV</h2>
        <p className="admin-section-hint">
          Données depuis les tables xp_* si synchronisées, sinon app_state.
        </p>
        <div className="admin-export-actions">
          <a className="admin-action-btn" href="/api/admin/export/orders">
            Télécharger commandes
          </a>
          <a className="admin-action-btn" href="/api/admin/export/payouts">
            Télécharger retraits
          </a>
        </div>
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
            <li>
              <span>Dual-write auto</span>
              <strong className={overview.health.relationalDualWrite ? "admin-health-ok" : ""}>
                {overview.health.relationalDualWrite ? "Actif (prod)" : "Manuel uniquement"}
              </strong>
            </li>
            {overview.health.relationalRead && (
              <li>
                <span>Lecture xp_*</span>
                <strong className="admin-health-ok">XP_RELATIONAL_READ=true</strong>
              </li>
            )}
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
