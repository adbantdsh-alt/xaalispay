"use client";

import { useMemo, useState } from "react";
import { Banknote, RotateCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatAdminDate, payoutStatusLabel, type PayoutRow } from "./admin-types";
import { EmptyState, EntityCell, Panel, SearchField, StatStrip, StatusPill, Tabs, toneForStatus } from "./AdminUI";

type StatusFilter = "" | "processing" | "failed" | "succeeded";

const METHOD_LABELS: Record<string, string> = { wave: "Wave", orange: "Orange Money" };

export function AdminPayoutsSection({
  payouts,
  retryingId,
  onRetry,
}: {
  payouts: PayoutRow[];
  retryingId: string | null;
  onRetry: (payoutId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");

  const groups = useMemo(() => {
    const inProgress = payouts.filter((p) => p.status === "pending" || p.status === "processing");
    const failed = payouts.filter((p) => p.status === "failed");
    const succeeded = payouts.filter((p) => p.status === "succeeded");
    return { inProgress, failed, succeeded };
  }, [payouts]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payouts.filter((p) => {
      if (status === "processing" && p.status !== "pending" && p.status !== "processing") return false;
      if ((status === "failed" || status === "succeeded") && p.status !== status) return false;
      if (!term) return true;
      return (
        p.sellerName.toLowerCase().includes(term) ||
        p.sellerUsername.toLowerCase().includes(term) ||
        p.phone.includes(term)
      );
    });
  }, [payouts, search, status]);

  const sum = (rows: PayoutRow[]) => rows.reduce((total, p) => total + p.amount, 0);

  return (
    <section className="admin-section">
      <StatStrip
        items={[
          {
            label: "Versé aux vendeurs",
            value: formatCurrency(sum(groups.succeeded)),
            hint: `${groups.succeeded.length} retrait(s) réussi(s)`,
            tone: "accent",
          },
          {
            label: "En cours",
            value: groups.inProgress.length,
            hint: formatCurrency(sum(groups.inProgress)),
          },
          {
            label: "En échec",
            value: groups.failed.length,
            hint: groups.failed.length ? `${formatCurrency(sum(groups.failed))} à relancer` : "rien à relancer",
            tone: groups.failed.length ? "warn" : "default",
          },
        ]}
      />

      <Panel
        title="Retraits"
        count={filtered.length}
        toolbar={
          <>
            <SearchField value={search} onChange={setSearch} placeholder="Vendeur ou numéro…" />
            <Tabs
              label="Filtrer par statut"
              value={status}
              onChange={setStatus}
              options={[
                { value: "", label: "Tous", count: payouts.length },
                { value: "processing", label: "En cours", count: groups.inProgress.length },
                { value: "failed", label: "En échec", count: groups.failed.length },
                { value: "succeeded", label: "Réussis", count: groups.succeeded.length },
              ]}
            />
          </>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon={Banknote} title="Aucun retrait" hint="Aucun retrait ne correspond à ces filtres." />
        ) : (
          <table className="ax-table">
            <thead>
              <tr>
                <th>Vendeur</th>
                <th className="is-num">Montant</th>
                <th>Destination</th>
                <th>Statut</th>
                <th>Demandé le</th>
                <th aria-label="Action" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((payout) => (
                <tr key={payout.id}>
                  <td>
                    <EntityCell name={payout.sellerName} sub={`@${payout.sellerUsername}`} />
                  </td>
                  <td className="is-num">{formatCurrency(payout.amount)}</td>
                  <td>
                    {METHOD_LABELS[payout.method] ?? payout.method}
                    <span className="ax-cell-sub admin-mono">{payout.phone}</span>
                  </td>
                  <td>
                    <StatusPill tone={toneForStatus(payout.status)} label={payoutStatusLabel(payout.status)} />
                    {payout.failureReason && <span className="ax-cell-sub">{payout.failureReason}</span>}
                  </td>
                  <td className="is-nowrap is-muted">{formatAdminDate(payout.createdAt)}</td>
                  <td className="is-nowrap">
                    {payout.status === "failed" && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--sm ax-btn--primary"
                        disabled={retryingId === payout.id}
                        onClick={() => onRetry(payout.id)}
                      >
                        <RotateCw size={13} aria-hidden="true" />
                        {retryingId === payout.id ? "Relance…" : "Relancer"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </section>
  );
}
