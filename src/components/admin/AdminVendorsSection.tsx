"use client";

import { formatCurrency } from "@/lib/utils";
import { buildVendorSupportWhatsAppUrl } from "@/lib/support";
import { formatAdminDate, type AdminVendorRow } from "./admin-types";

export function AdminVendorsSection({ vendors }: { vendors: AdminVendorRow[] }) {
  return (
    <section className="admin-section">
      <header className="admin-section-head">
        <div>
          <h2 className="admin-card-title">Vendeurs</h2>
          <p className="admin-card-desc">{vendors.length} compte(s) vendeur</p>
        </div>
      </header>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Vendeur</th>
              <th>Soldes</th>
              <th>Activité</th>
              <th>Email</th>
              <th>Inscription</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty">
                  Aucun vendeur
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => {
                const wa = buildVendorSupportWhatsAppUrl(vendor.phone, vendor.username);
                return (
                  <tr key={vendor.id}>
                    <td>
                      <strong>@{vendor.username}</strong>
                      <span className="admin-cell-sub">{vendor.displayName}</span>
                    </td>
                    <td className="admin-pilot-metrics">
                      {formatCurrency(vendor.available)} dispo
                      <br />
                      {formatCurrency(vendor.escrow)} séquestre
                    </td>
                    <td className="admin-pilot-metrics">
                      {vendor.productCount} prod · {vendor.orderCount} cmd
                      {vendor.disputeCount > 0 && (
                        <span className="admin-badge warn"> {vendor.disputeCount} litige(s)</span>
                      )}
                    </td>
                    <td>
                      {vendor.emailVerified ? (
                        <span className="admin-badge good">Vérifié</span>
                      ) : (
                        <span className="admin-badge warn">Non vérifié</span>
                      )}
                    </td>
                    <td className="text-muted">{formatAdminDate(vendor.createdAt)}</td>
                    <td>
                      {wa ? (
                        <a href={wa} target="_blank" rel="noopener noreferrer" className="admin-pilot-wa-link">
                          WhatsApp
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
