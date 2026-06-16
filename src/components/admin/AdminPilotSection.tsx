"use client";

import { buildVendorSupportWhatsAppUrl } from "@/lib/support";
import { formatAdminDate } from "./admin-types";
import type { PilotDashboardData, PilotVendorRow } from "./admin-types";

function stageClass(stageIndex: number, maxIndex: number) {
  if (stageIndex >= maxIndex) return "good";
  if (stageIndex >= maxIndex - 1) return "warn";
  return "neutral";
}

function VendorRow({ vendor }: { vendor: PilotVendorRow }) {
  const waUrl = buildVendorSupportWhatsAppUrl(vendor.phone, vendor.username);

  return (
    <tr>
      <td>
        <strong>@{vendor.username}</strong>
        <br />
        <span className="text-muted">{vendor.displayName}</span>
      </td>
      <td>
        <span className={`admin-badge ${stageClass(vendor.stageIndex, 5)}`}>
          {vendor.stageLabel}
        </span>
      </td>
      <td className="admin-pilot-metrics">
        {vendor.productCount} prod · {vendor.paidOrderCount} payée(s) · {vendor.payoutSuccessCount} retrait(s)
      </td>
      <td className="text-muted">{vendor.daysSinceSignup} j</td>
      <td className="text-muted">{formatAdminDate(vendor.createdAt)}</td>
      <td>
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-pilot-wa-link"
          >
            WhatsApp
          </a>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
    </tr>
  );
}

export function AdminPilotSection({ pilot }: { pilot: PilotDashboardData }) {
  const { target, sellerCount, completeCount, funnel, vendors, supportWhatsAppConfigured } =
    pilot;
  const progressPct = Math.min(100, Math.round((sellerCount / target.min) * 100));
  const completePct =
    sellerCount > 0 ? Math.round((completeCount / sellerCount) * 100) : 0;

  return (
    <section className="admin-section">
      <article className="admin-card">
        <header className="admin-card-head">
          <div>
            <h2 className="admin-card-title">Pilote vendeurs — Phase 7</h2>
            <p className="admin-card-desc">
              Objectif {target.min}–{target.max} vendeurs avec parcours complet payin → livraison → retrait.
            </p>
          </div>
          <div className="admin-pilot-target-badge">
            {sellerCount}/{target.max} inscrits
          </div>
        </header>

        <div className="admin-pilot-progress">
          <div className="admin-pilot-progress-bar">
            <div
              className="admin-pilot-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="admin-pilot-progress-label text-muted">
            {completeCount} parcours complet(s) ({completePct}%) ·{" "}
            {supportWhatsAppConfigured ? "Support WhatsApp configuré" : "NEXT_PUBLIC_SUPPORT_WHATSAPP manquant"}
          </p>
        </div>
      </article>

      <article className="admin-card">
        <h3 className="admin-card-subtitle">Entonnoir de conversion</h3>
        <div className="admin-pilot-funnel">
          {funnel.map((step, i) => (
            <div key={step.stage} className="admin-pilot-funnel-step">
              <p className="admin-pilot-funnel-count">{step.count}</p>
              <p className="admin-pilot-funnel-label">{step.label}</p>
              {i > 0 && step.rateFromPrevious !== null && (
                <p className="admin-pilot-funnel-rate text-muted">{step.rateFromPrevious}% →</p>
              )}
            </div>
          ))}
        </div>
      </article>

      <article className="admin-card">
        <h3 className="admin-card-subtitle">Vendeurs pilotes ({vendors.length})</h3>
        {vendors.length === 0 ? (
          <p className="text-muted">Aucun vendeur inscrit pour l&apos;instant.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vendeur</th>
                  <th>Étape</th>
                  <th>Activité</th>
                  <th>Ancienneté</th>
                  <th>Inscription</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <VendorRow key={vendor.id} vendor={vendor} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
