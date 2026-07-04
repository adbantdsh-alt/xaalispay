"use client";

import { formatCurrency } from "@/lib/utils";
import { adminStatusClass, formatAdminDate, payoutStatusLabel, type PayoutRow } from "./admin-types";

export function AdminPayoutsSection({
  payouts,
  retryingId,
  onRetry,
  forcingId,
  onForceSucceed,
}: {
  payouts: PayoutRow[];
  retryingId: string | null;
  onRetry: (payoutId: string) => void;
  forcingId: string | null;
  onForceSucceed: (payoutId: string) => void;
}) {
  const failedCount = payouts.filter((p) => p.status === "failed").length;
  const pendingCount = payouts.filter(
    (p) => p.status === "pending" || p.status === "processing"
  ).length;

  return (
    <section className="admin-section">
      {(failedCount > 0 || pendingCount > 0) && (
        <p className="admin-section-hint">
          {pendingCount > 0 && `${pendingCount} en cours`}
          {pendingCount > 0 && failedCount > 0 && " · "}
          {failedCount > 0 && (
            <>
              <span className="admin-hint-strong admin-hint-strong--bad">{failedCount} échoué(s)</span>
              {" — relancer si le vendeur n'a pas reçu"}
            </>
          )}
        </p>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Vendeur</th>
              <th>Montant</th>
              <th>Méthode</th>
              <th>Téléphone</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {payouts.length === 0 ? (
              <tr>
                <td colSpan={7}>Aucun retrait</td>
              </tr>
            ) : (
              payouts.map((payout) => (
                <tr key={payout.id}>
                  <td>
                    <strong>{payout.sellerName}</strong>
                    <span className="admin-cell-sub admin-mono">@{payout.sellerUsername}</span>
                  </td>
                  <td className="admin-mono">{formatCurrency(payout.amount)}</td>
                  <td>{payout.method}</td>
                  <td className="admin-mono">{payout.phone}</td>
                  <td>
                    <span className={`admin-badge ${adminStatusClass(payout.status)}`}>
                      {payoutStatusLabel(payout.status)}
                    </span>
                    {payout.failureReason && (
                      <span className="admin-cell-sub">{payout.failureReason}</span>
                    )}
                  </td>
                  <td>{formatAdminDate(payout.createdAt)}</td>
                  <td>
                    {payout.status === "failed" ? (
                      <button
                        type="button"
                        className="admin-action-btn"
                        disabled={retryingId === payout.id}
                        onClick={() => onRetry(payout.id)}
                      >
                        {retryingId === payout.id ? "…" : "Relancer"}
                      </button>
                    ) : payout.status === "processing" ? (
                      <button
                        type="button"
                        className="admin-action-btn admin-action-btn--warn"
                        disabled={forcingId === payout.id}
                        onClick={() => onForceSucceed(payout.id)}
                      >
                        {forcingId === payout.id ? "…" : "Forcer réussi"}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
