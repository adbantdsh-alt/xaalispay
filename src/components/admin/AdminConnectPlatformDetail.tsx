"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { adaptConnectPayoutRow, adaptConnectTransactionRow } from "./admin-adapters";
import { DetailPanel, DetailSection, StatusPill, toneForStatus } from "./AdminUI";
import {
  connectPayoutStatusLabel,
  connectTransactionStatusLabel,
  formatAdminDate,
  type ConnectBalanceSummary,
  type ConnectPlatformDetail,
} from "./admin-types";

function BalanceGroup({ balances }: { balances: ConnectBalanceSummary }) {
  const cells = [
    ["Disponible", balances.available_total],
    ["En séquestre", balances.escrow_total],
    ["Bloqué (litiges)", balances.blocked_total],
    ["Déjà versé", balances.paid_out_total],
  ] as const;
  return (
    <div className="ax-balance">
      {cells.map(([label, value]) => (
        <div key={label} className="ax-balance-cell">
          <span>{label}</span>
          <strong className="admin-mono">{formatCurrency(value)}</strong>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptDetail(data: any): ConnectPlatformDetail {
  return {
    platform: {
      id: String(data.platform.id),
      name: data.platform.name,
      slug: data.platform.slug,
      country: data.platform.country,
      currency: data.platform.currency,
      xaalispayFeePercent: data.platform.xaalispay_fee_percent,
      xaalispayPayoutFeePercent: data.platform.xaalispay_payout_fee_percent,
      isActive: data.platform.is_active,
      createdAt: data.platform.created_at,
    },
    balances: data.balances,
    revenueTotal: data.revenue_total,
    bictorysFeesTotal: data.bictorys_fees_total,
    netRevenue: data.net_revenue,
    accountsCount: data.accounts_count,
    recentTransactions: data.recent_transactions.map(adaptConnectTransactionRow),
    recentPayouts: data.recent_payouts.map(adaptConnectPayoutRow),
  };
}

export function AdminConnectPlatformDetail({ platformId, onClose }: { platformId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<ConnectPlatformDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch(`/api/admin/connect/platforms/${platformId}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setError("Plateforme introuvable.");
          return;
        }
        setDetail(adaptDetail(await res.json()));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [platformId]);

  const platform = detail?.platform;

  return (
    <DetailPanel
      wide
      title={platform ? platform.name : "Plateforme"}
      subtitle={platform ? `${platform.slug} · ${platform.country} · inscrite le ${formatAdminDate(platform.createdAt)}` : undefined}
      badge={platform && <StatusPill tone={platform.isActive ? "good" : "neutral"} label={platform.isActive ? "Active" : "Inactive"} />}
      onClose={onClose}
    >
      {loading && <p className="ax-muted ax-pad">Chargement…</p>}
      {!loading && error && <p className="ax-muted ax-pad">{error}</p>}

      {!loading && detail && platform && (
        <>
          <div className="ax-chip-row ax-pad">
            <span className="av-meta-chip">Encaissement {(Number(platform.xaalispayFeePercent) * 100).toFixed(2)} %</span>
            <span className="av-meta-chip">Retrait {(Number(platform.xaalispayPayoutFeePercent) * 100).toFixed(2)} %</span>
            <span className="av-meta-chip">{detail.accountsCount} compte(s) connecté(s)</span>
            <span className="av-meta-chip">{platform.currency}</span>
          </div>

          <DetailSection title="Ce que cette plateforme rapporte à XaalisPay">
            <div className="av-net-band">
              <div>
                <span>Revenu brut</span>
                <strong className="admin-mono">{formatCurrency(detail.revenueTotal)}</strong>
              </div>
              <span className="av-net-op" aria-hidden="true">−</span>
              <div>
                <span>Frais Bictorys de ses flux</span>
                <strong className="admin-mono av-minus">{formatCurrency(detail.bictorysFeesTotal)}</strong>
              </div>
              <span className="av-net-op" aria-hidden="true">=</span>
              <div>
                <span>Bénéfice net</span>
                <strong className="admin-mono av-net-total">{formatCurrency(detail.netRevenue)}</strong>
              </div>
            </div>
          </DetailSection>

          <DetailSection title="Commission de la plateforme">
            <BalanceGroup balances={detail.balances.platform_own} />
            <p className="ax-muted">Sa commission perçue via Connect uniquement, jamais son revenu total.</p>
          </DetailSection>

          <DetailSection title="Fonds de ses marchands">
            <BalanceGroup balances={detail.balances.merchants} />
          </DetailSection>

          <DetailSection title={`Transactions récentes · ${detail.recentTransactions.length}`}>
            {detail.recentTransactions.length === 0 ? (
              <p className="ax-muted">Aucune transaction.</p>
            ) : (
              <ul className="ax-list">
                {detail.recentTransactions.map((t) => (
                  <li key={t.id}>
                    <span className="ax-list-main">
                      <span className="ax-list-title admin-mono">{t.externalRef || t.id.slice(0, 8)}</span>
                      <span className="ax-list-sub">
                        {formatAdminDate(t.createdAt)} · XaalisPay {formatCurrency(t.xaalispayFee)} · plateforme{" "}
                        {formatCurrency(t.applicationFee)}
                      </span>
                    </span>
                    <span className="ax-list-amount admin-mono">{formatCurrency(t.amount)}</span>
                    <StatusPill tone={toneForStatus(t.status)} label={connectTransactionStatusLabel(t.status)} />
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>

          <DetailSection title={`Retraits récents · ${detail.recentPayouts.length}`}>
            {detail.recentPayouts.length === 0 ? (
              <p className="ax-muted">Aucun retrait.</p>
            ) : (
              <ul className="ax-list">
                {detail.recentPayouts.map((p) => (
                  <li key={p.id}>
                    <span className="ax-list-main">
                      <span className="ax-list-title">
                        {p.method === "wave" ? "Wave" : p.method === "orange" ? "Orange Money" : p.method}{" "}
                        <span className="admin-mono">{p.phone}</span>
                      </span>
                      <span className="ax-list-sub">
                        {formatAdminDate(p.createdAt)} · net envoyé {formatCurrency(p.netAmount)} · frais XaalisPay{" "}
                        {formatCurrency(p.xaalispayFee)}
                        {p.failureReason ? ` · ${p.failureReason}` : ""}
                      </span>
                    </span>
                    <span className="ax-list-amount admin-mono">{formatCurrency(p.amount)}</span>
                    <StatusPill tone={toneForStatus(p.status)} label={connectPayoutStatusLabel(p.status)} />
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>
        </>
      )}
    </DetailPanel>
  );
}
