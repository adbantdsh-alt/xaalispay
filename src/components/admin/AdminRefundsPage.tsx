"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { adminStatusClass, formatAdminDate } from "./admin-types";

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

  return (
    <section className="admin-section av-overview">
      <article className="av-card">
        <div className="av-card-head">
          <h2 className="av-card-title">Jamais envoyés</h2>
          <span className={`av-pill ${data.unsent.length ? "av-pill--warn" : "av-pill--good"}`}>
            {data.unsent.length ? `${data.unsent.length} à vérifier` : "Aucun"}
          </span>
        </div>
        <p className="av-card-hint">
          Marqués remboursés en base, mais l&apos;argent n&apos;est jamais parti. Vérifiez dans le tableau de bord
          Bictorys que le payeur n&apos;a pas été remboursé à la main avant tout envoi.
        </p>
        {data.unsent.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Origine</th>
                  <th>Montant</th>
                  <th>Payeur</th>
                  <th>Marqué remboursé le</th>
                </tr>
              </thead>
              <tbody>
                {data.unsent.map((r) => (
                  <tr key={r.merchant_reference}>
                    <td className="admin-mono">{r.merchant_reference}</td>
                    <td>{r.source}</td>
                    <td className="admin-mono">{formatCurrency(r.amount)}</td>
                    <td className="admin-mono">{r.phone || "—"}</td>
                    <td>{formatAdminDate(r.refunded_at ?? undefined)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="av-card">
        <div className="av-card-head">
          <h2 className="av-card-title">Historique</h2>
          {failed.length > 0 && <span className="av-pill av-pill--warn">{failed.length} échoué(s)</span>}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Origine</th>
                <th>Montant</th>
                <th>Envoyé à</th>
                <th>Frais Bictorys</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {data.refunds.length === 0 ? (
                <tr>
                  <td colSpan={6}>Aucun remboursement envoyé pour l&apos;instant</td>
                </tr>
              ) : (
                data.refunds.map((r) => (
                  <tr key={r.id}>
                    <td>{formatAdminDate(r.created_at)}</td>
                    <td>
                      <strong>{r.source}</strong>
                      <span className="admin-cell-sub admin-mono">{r.merchant_reference}</span>
                    </td>
                    <td className="admin-mono">{formatCurrency(r.amount)}</td>
                    <td className="admin-mono">{r.phone || "—"}</td>
                    <td className="admin-mono">
                      {r.bictorys_fee == null ? "—" : `${Number(r.bictorys_fee).toLocaleString("fr-FR")} F`}
                    </td>
                    <td>
                      <span className={`admin-badge ${adminStatusClass(r.status)}`}>
                        {REFUND_STATUS_LABELS[r.status] ?? r.status}
                      </span>
                      {r.failure_reason && <span className="admin-cell-sub">{r.failure_reason}</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
