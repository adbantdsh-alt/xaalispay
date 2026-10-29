"use client";

import { useState } from "react";
import { Handshake } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";
import { buildReferralUrl } from "@/lib/site-url";
import { formatCurrency } from "@/lib/utils";
import { formatAdminDate, type ApprovedAffiliateRow } from "./admin-types";
import { EmptyState, EntityCell, Panel, SearchField } from "./AdminUI";
import { ExtendBoostCell } from "./AdminAffiliationSection";

/** Tous les vendeurs autorisés à parrainer (demande approuvée), y compris
 * ceux qui n'ont encore aucun filleul — la table « parrains » plus bas ne
 * liste que ceux qui en ont au moins un. */
export function AdminApprovedAffiliatesPanel({
  affiliates,
  onExtendAllBoost,
}: {
  affiliates: ApprovedAffiliateRow[];
  onExtendAllBoost: (referrerId: number, days: number) => Promise<boolean>;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = q
    ? affiliates.filter((a) => a.username.toLowerCase().includes(q) || a.businessName.toLowerCase().includes(q))
    : affiliates;

  return (
    <Panel
      title="Affiliés approuvés"
      count={affiliates.length}
      toolbar={<SearchField value={query} onChange={setQuery} placeholder="Rechercher un affilié…" />}
    >
      {rows.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title={affiliates.length ? "Aucun affilié ne correspond" : "Aucun affilié approuvé"}
          hint={affiliates.length ? undefined : "Les vendeurs apparaissent ici dès que leur demande est approuvée."}
        />
      ) : (
        <table className="ax-table">
          <thead>
            <tr>
              <th>Affilié</th>
              <th>Téléphone</th>
              <th>Lien d&apos;affiliation</th>
              <th className="is-num">Filleuls</th>
              <th className="is-num">Commissions</th>
              <th>Approuvé le</th>
              <th>Prolonger le palier 1 %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const url = buildReferralUrl(a.username);
              return (
                <tr key={a.id}>
                  <td>
                    <EntityCell name={a.businessName} sub={`@${a.username}`} />
                  </td>
                  <td className="is-nowrap admin-mono">{a.phone}</td>
                  <td>
                    <span className="ax-inline-form">
                      <span className="ax-cell-sub admin-mono">?ref={a.username}</span>
                      <CopyButton text={url} label="Copier" className="ax-btn ax-btn--sm" />
                    </span>
                  </td>
                  <td className="is-num">{a.referralCount}</td>
                  <td className="is-num is-nowrap">{formatCurrency(a.totalCommission)}</td>
                  <td className="is-nowrap is-muted">{a.approvedAt ? formatAdminDate(a.approvedAt) : "—"}</td>
                  <td>
                    {/* Le palier 1 % est porté par chaque filleul : rien à
                        prolonger tant que l'affilié n'en a aucun. */}
                    {a.referralCount > 0 ? (
                      <ExtendBoostCell referrerId={a.id} onExtendAllBoost={onExtendAllBoost} />
                    ) : (
                      <span className="ax-cell-sub">Aucun filleul</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
