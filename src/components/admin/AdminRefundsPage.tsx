"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { Undo2 } from "lucide-react";
import { formatAdminDate } from "./admin-types";
import { EmptyState, Panel, StatStrip, StatusPill, toneForStatus } from "./AdminUI";

type UnsentRefund = {
  merchant_reference: string;
  source: string;
  amount: number;
  refunded_at: string | null;
  phone: string;
};

type RefundRow = {
  id: number;
  merchant_reference: string;
  source: string;
  amount: number;
  phone: string;
  status: string;
  bictorys_fee: number | null;
  failure_reason: string;
  created_at: string;
};

const REFUND_STATUS_LABELS: Record<string, string> = {
  pending: "À envoyer",
  processing: "En cours",
  succeeded: "Réussi",
  failed: "Échoué",
};

/** Lecture seule : aucun envoi d'argent depuis l'admin. Un remboursement
 * jamais envoyé se vérifie d'abord dans le tableau de bord Bictorys (le
 * payeur a pu être remboursé à la main), puis s'envoie avec la commande
 * `bictorys_unsent_refunds --send <référence>`. */
export function AdminRefundsPage() {
  const [data, setData] = useState<{ unsent: UnsentRefund[]; refunds: RefundRow[] } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/admin/refunds").then(async (res) => {
      if (cancelled) return;
      if (res.ok) setData(await res.json());
      else setError("Impossible de charger les remboursements.");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="admin-section-hint">{error}</p>;
  if (!data) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  const failed = data.refunds.filter((r) => r.status === "failed");
  const succeeded = data.refunds.filter((r) => r.status === "succeeded");
  const unsentTotal = data.unsent.reduce((sum, r) => sum + r.amount, 0);

  return (
    <section className="admin-section">
      <StatStrip
        items={[
          {
            label: "Jamais envoyés",
            value: data.unsent.length,
            hint: data.unsent.length ? `${formatCurrency(unsentTotal)} à vérifier` : "rien à vérifier",
            tone: data.unsent.length ? "warn" : "default",
          },
          { label: "En échec", value: failed.length, hint: "à traiter à la main", tone: failed.length ? "warn" : "default" },
          {
            label: "Remboursés",
            value: formatCurrency(succeeded.reduce((sum, r) => sum + r.amount, 0)),
            hint: `${succeeded.length} remboursement(s) réussi(s)`,
            tone: "accent",
          },
        ]}
      />

      {data.unsent.length > 0 && (
        <Panel title="Jamais envoyés" count={data.unsent.length}>
          <p className="ax-panel-note">
            Marqués remboursés en base, mais l&apos;argent n&apos;est jamais parti. Vérifiez dans le tableau de bord
            Bictorys que le payeur n&apos;a pas été remboursé à la main avant tout envoi.
          </p>
          <table className="ax-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Origine</th>
                <th>Payeur</th>
                <th className="is-num">Montant</th>
                <th>Marqué remboursé le</th>
              </tr>
            </thead>
            <tbody>
              {data.unsent.map((r) => (
                <tr key={r.merchant_reference}>
                  <td className="admin-mono">{r.merchant_reference}</td>
                  <td>{r.source}</td>
                  <td className="admin-mono is-muted">{r.phone || "—"}</td>
                  <td className="is-num">{formatCurrency(r.amount)}</td>
                  <td className="is-nowrap is-muted">{formatAdminDate(r.refunded_at ?? undefined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      <Panel title="Historique" count={data.refunds.length}>
        {data.refunds.length === 0 ? (
          <EmptyState
            icon={Undo2}
            title="Aucun remboursement envoyé"
            hint="Les remboursements envoyés via Bictorys apparaîtront ici avec leur statut et leurs frais."
          />
        ) : (
          <table className="ax-table">
            <thead>
              <tr>
                <th>Origine</th>
                <th>Envoyé à</th>
                <th className="is-num">Montant</th>
                <th className="is-num">Frais Bictorys</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.refunds.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="ax-cell-strong">{r.source}</span>
                    <span className="ax-cell-sub admin-mono">{r.merchant_reference}</span>
                  </td>
                  <td className="admin-mono is-muted">{r.phone || "—"}</td>
                  <td className="is-num">{formatCurrency(r.amount)}</td>
                  <td className="is-num">
                    {r.bictorys_fee == null ? "—" : `${Number(r.bictorys_fee).toLocaleString("fr-FR")} F`}
                  </td>
                  <td>
                    <StatusPill tone={toneForStatus(r.status)} label={REFUND_STATUS_LABELS[r.status] ?? r.status} />
                    {r.failure_reason && <span className="ax-cell-sub">{r.failure_reason}</span>}
                  </td>
                  <td className="is-nowrap is-muted">{formatAdminDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </section>
  );
}
