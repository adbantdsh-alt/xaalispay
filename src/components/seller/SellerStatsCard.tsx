"use client";

import { formatCurrency } from "@/lib/utils";
import type { SellerStats } from "@/lib/seller-stats";

export function SellerStatsCard({ stats }: { stats: SellerStats }) {
  if (stats.totalOrders === 0) return null;

  const items = [
    { label: "Ventes terminées", value: String(stats.completedSales) },
    { label: "En cours", value: String(stats.inProgress) },
    { label: "Litiges actifs", value: String(stats.activeDisputes), warn: stats.activeDisputes > 0 },
    { label: "CA libéré", value: formatCurrency(stats.totalRevenue) },
    { label: "Panier moyen", value: stats.avgOrderValue > 0 ? formatCurrency(stats.avgOrderValue) : "—" },
    {
      label: "Taux remboursement",
      value: `${stats.chargebackRate}%`,
      warn: stats.chargebackRate >= 5,
      danger: stats.chargebackRate >= 10,
    },
  ];

  return (
    <section className="seller-stats-card animate-fade-up">
      <h2 className="seller-stats-title">Performance</h2>
      <div className="seller-stats-grid">
        {items.map((item) => (
          <div
            key={item.label}
            className={`seller-stats-item${item.danger ? " seller-stats-item--danger" : item.warn ? " seller-stats-item--warn" : ""}`}
          >
            <span className="seller-stats-value">{item.value}</span>
            <span className="seller-stats-label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
