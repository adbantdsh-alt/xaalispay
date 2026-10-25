"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { calculateSellerCommission } from "@/lib/fees";
import { formatCurrency } from "@/lib/utils";
import { formatAdminDate, isDisputeOverdue, type DisputeRow } from "./admin-types";
import {
  ContactCard,
  DetailPanel,
  DetailSection,
  EmptyState,
  EntityCell,
  KeyValues,
  Panel,
  StatStrip,
  StatusPill,
  Timeline,
} from "./AdminUI";

type ResolutionAction = "release_full" | "refund_full" | "split";

type PendingDecision = { action: ResolutionAction; refundAmount?: number };

const DECISION_TITLES: Record<ResolutionAction, string> = {
  refund_full: "Rembourser l'acheteur",
  release_full: "Libérer au vendeur",
  split: "Partager le montant",
};

/** Ce que la décision va réellement faire, montants compris — affiché AVANT
 * exécution (étape de confirmation : décision irréversible, argent réel). */
function decisionLines(dispute: DisputeRow, decision: PendingDecision): string[] {
  const total = dispute.total;
  if (decision.action === "refund_full") {
    return [
      `${formatCurrency(total)} renvoyés à ${dispute.clientName} (${dispute.clientPhone})`,
      `Le vendeur ${dispute.sellerName} ne reçoit rien`,
    ];
  }
  if (decision.action === "release_full") {
    const commission = calculateSellerCommission(total);
    return [
      `${formatCurrency(total - commission)} crédités à ${dispute.sellerName} (commission ${formatCurrency(commission)} déduite)`,
      `L'acheteur ${dispute.clientName} n'est pas remboursé`,
    ];
  }
  const refund = decision.refundAmount ?? 0;
  const sellerPart = total - refund;
  const commission = calculateSellerCommission(sellerPart);
  return [
    `${formatCurrency(refund)} renvoyés à ${dispute.clientName} (${dispute.clientPhone})`,
    `${formatCurrency(sellerPart - commission)} crédités à ${dispute.sellerName} (commission ${formatCurrency(commission)} déduite)`,
  ];
}

export function AdminDisputesSection({
  disputes,
  resolving,
  onResolve,
  onActivityChange,
}: {
  disputes: DisputeRow[];
  resolving: string | null;
  onResolve: (disputeId: string, action: ResolutionAction, refundAmount?: number) => Promise<boolean>;
  onActivityChange?: (busy: boolean) => void;
}) {
  const [selectedDispute, setSelectedDispute] = useState<DisputeRow | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [splitAmount, setSplitAmount] = useState("");
  const [showSplitForm, setShowSplitForm] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);

  useEffect(() => {
    onActivityChange?.(!!selectedDispute || !!lightboxUrl);
  }, [selectedDispute, lightboxUrl, onActivityChange]);

  const openDispute = (dispute: DisputeRow) => {
    setSelectedDispute(dispute);
    setShowSplitForm(false);
    setSplitAmount("");
    setPendingDecision(null);
  };

  const resolve = async (disputeId: string, action: ResolutionAction, refundAmount?: number) => {
    const ok = await onResolve(disputeId, action, refundAmount);
    if (ok) {
      setSelectedDispute(null);
      setPendingDecision(null);
    }
  };

  const blockedTotal = disputes.reduce((sum, d) => sum + d.total, 0);
  const overdueCount = disputes.filter(isDisputeOverdue).length;
  const withProofs = disputes.filter((d) => d.disputeMedia.length > 0).length;

  return (
    <>
      <section className="admin-section">
        <StatStrip
          items={[
            {
              label: "Litiges ouverts",
              value: disputes.length,
              hint: disputes.length ? "à arbitrer en priorité" : "rien à arbitrer",
              tone: disputes.length ? "warn" : "default",
            },
            { label: "Argent bloqué", value: formatCurrency(blockedTotal), hint: "jusqu'à la décision", tone: "accent" },
            { label: "Délai vendeur dépassé", value: overdueCount, hint: "le vendeur n'a pas répondu à temps" },
            { label: "Avec preuves", value: withProofs, hint: "photos ou vidéos de l'acheteur" },
          ]}
        />

        <Panel title="Litiges en attente d'arbitrage" count={disputes.length}>
          {disputes.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="Aucun litige ouvert" hint="Bonne nouvelle : aucun argent bloqué en litige." />
          ) : (
            <table className="ax-table">
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Motif</th>
                  <th>Vendeur</th>
                  <th>Acheteur</th>
                  <th className="is-num">Montant</th>
                  <th>Ouvert le</th>
                  <th aria-label="Action" />
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => (
                  <tr key={d.id} className="ax-row" tabIndex={0} onClick={() => openDispute(d)} onKeyDown={(e) => e.key === "Enter" && openDispute(d)}>
                    <td>
                      <span className="ax-cell-strong admin-mono">{d.orderNumber}</span>
                      <span className="ax-cell-sub">{d.productName}</span>
                    </td>
                    <td>
                      <span className="ax-cell-strong">{d.disputeTypeLabel}</span>
                      <span className="ax-cell-tags">
                        {isDisputeOverdue(d) && <StatusPill tone="bad" label="Délai dépassé" />}
                        {d.disputeMedia.length > 0 && <StatusPill tone="info" label={`${d.disputeMedia.length} preuve(s)`} />}
                      </span>
                    </td>
                    <td>
                      <EntityCell name={d.sellerName} sub={`@${d.sellerUsername}`} />
                    </td>
                    <td>
                      {d.clientName}
                      <span className="ax-cell-sub admin-mono">{d.clientPhone}</span>
                    </td>
                    <td className="is-num">{formatCurrency(d.total)}</td>
                    <td className="is-nowrap is-muted">{formatAdminDate(d.disputeOpenedAt)}</td>
                    <td className="is-nowrap">
                      <span className="ax-btn ax-btn--sm ax-btn--primary">Arbitrer</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </section>

      {selectedDispute && (
        <DetailPanel
          wide
          title={`Litige ${selectedDispute.orderNumber}`}
          subtitle={selectedDispute.productName}
          badge={
            isDisputeOverdue(selectedDispute) ? (
              <StatusPill tone="bad" label="Délai dépassé" />
            ) : (
              <StatusPill tone="warn" label="En attente" />
            )
          }
          onClose={() => setSelectedDispute(null)}
        >
          <div className="ax-summary">
            <div>
              <div className="ax-summary-label">Montant bloqué</div>
              <div className="ax-summary-amount">{formatCurrency(selectedDispute.total)}</div>
            </div>
            <span className="ax-muted">
              {selectedDispute.sellerResponseDeadlineAt
                ? `Délai vendeur : ${formatAdminDate(selectedDispute.sellerResponseDeadlineAt)}`
                : `Ouvert le ${formatAdminDate(selectedDispute.disputeOpenedAt)}`}
            </span>
          </div>

          <DetailSection title={`Motif · ${selectedDispute.disputeTypeLabel}`}>
            <p className="ax-callout">{selectedDispute.disputeReason || "Motif non précisé par l'acheteur."}</p>
          </DetailSection>

          {selectedDispute.disputeMedia.length > 0 && (
            <DetailSection title={`Preuves · ${selectedDispute.disputeMedia.length}`}>
              <div className="admin-media-grid">
                {selectedDispute.disputeMedia.map((m, i) =>
                  m.type === "image" ? (
                    <button
                      key={i}
                      type="button"
                      className="admin-media-thumb"
                      onClick={() => setLightboxUrl(m.url)}
                      title="Agrandir"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt={m.name || `Photo ${i + 1}`} loading="lazy" />
                      <span className="admin-media-overlay">Voir</span>
                    </button>
                  ) : (
                    <a
                      key={i}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-media-thumb admin-media-video"
                    >
                      <span>▶ Vidéo {i + 1}</span>
                    </a>
                  )
                )}
              </div>
            </DetailSection>
          )}

          <DetailSection title="Parties">
            <div className="ax-contacts">
              <ContactCard
                role="Acheteur"
                name={selectedDispute.clientName}
                phone={selectedDispute.clientPhone}
                sub={selectedDispute.clientAddress}
              />
              <ContactCard
                role={`Vendeur · @${selectedDispute.sellerUsername}`}
                name={selectedDispute.sellerName}
                phone={selectedDispute.sellerPhone}
              />
            </div>
          </DetailSection>

          <DetailSection title="Chronologie">
            <Timeline
              items={[
                { label: "Commande créée", date: formatAdminDate(selectedDispute.createdAt) },
                ...(selectedDispute.paidAt
                  ? [
                      {
                        label: `Paiement confirmé${selectedDispute.paymentMethod ? ` (${selectedDispute.paymentMethod})` : ""}`,
                        date: formatAdminDate(selectedDispute.paidAt),
                        tone: "ok" as const,
                      },
                    ]
                  : []),
                ...(selectedDispute.clientDeliveryConfirmedAt
                  ? [
                      {
                        label: "Réception confirmée par l'acheteur",
                        date: formatAdminDate(selectedDispute.clientDeliveryConfirmedAt),
                        tone: "ok" as const,
                      },
                    ]
                  : []),
                ...(selectedDispute.disputeOpenedAt
                  ? [{ label: "Litige ouvert", date: formatAdminDate(selectedDispute.disputeOpenedAt), tone: "bad" as const }]
                  : []),
              ]}
            />
          </DetailSection>

          <DetailSection title="Montants">
            <KeyValues
              rows={[
                { label: "Total commande", value: formatCurrency(selectedDispute.total) },
                { label: "Frais protection acheteur (gardés)", value: formatCurrency(selectedDispute.buyerProtectionFee) },
              ]}
            />
          </DetailSection>

            <div className="ax-dsection admin-arbitrage">
              <h3 className="ax-dsection-title">Décision d&apos;arbitrage</h3>
              <div className="admin-arbitrage-warn">
                <TriangleAlert size={18} aria-hidden="true" />
                <span>Action irréversible — vérifiez les preuves et contactez les parties avant de trancher.</span>
              </div>
              {pendingDecision ? (
                <div className={`admin-arbitrage-confirm is-${pendingDecision.action}`} role="alertdialog" aria-labelledby="arbitrage-confirm-title">
                  <p id="arbitrage-confirm-title" className="admin-arbitrage-confirm-title">
                    Confirmer : {DECISION_TITLES[pendingDecision.action]}
                  </p>
                  <ul className="admin-arbitrage-confirm-lines">
                    {decisionLines(selectedDispute, pendingDecision).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <div className="admin-arbitrage-actions">
                    <button
                      type="button"
                      className="admin-arbitrage-btn admin-arbitrage-cancel"
                      disabled={resolving !== null}
                      onClick={() => setPendingDecision(null)}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className={`admin-arbitrage-btn admin-arbitrage-go`}
                      disabled={resolving !== null}
                      onClick={() =>
                        resolve(selectedDispute.id, pendingDecision.action, pendingDecision.refundAmount)
                      }
                    >
                      {resolving === selectedDispute.id + pendingDecision.action ? (
                        <>
                          <span className="btn-spinner" aria-hidden="true" />
                          En cours…
                        </>
                      ) : (
                        "Confirmer la décision"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
              <>
              <div className="admin-arbitrage-actions">
                <button
                  type="button"
                  className="admin-arbitrage-btn admin-arbitrage-refund"
                  disabled={resolving !== null}
                  onClick={() => setPendingDecision({ action: "refund_full" })}
                >
                  {resolving === selectedDispute.id + "refund_full" ? (
                    <>
                      <span className="btn-spinner" aria-hidden="true" />
                      En cours…
                    </>
                  ) : (
                    "Rembourser l'acheteur"
                  )}
                </button>
                <button
                  type="button"
                  className="admin-arbitrage-btn admin-arbitrage-release"
                  disabled={resolving !== null}
                  onClick={() => setPendingDecision({ action: "release_full" })}
                >
                  {resolving === selectedDispute.id + "release_full" ? (
                    <>
                      <span className="btn-spinner" aria-hidden="true" />
                      En cours…
                    </>
                  ) : (
                    "Libérer au vendeur"
                  )}
                </button>
              </div>
              <button
                type="button"
                className="admin-arbitrage-split"
                disabled={resolving !== null}
                onClick={() => setShowSplitForm((v) => !v)}
              >
                Remboursement partiel…
              </button>

              {showSplitForm && (
                <div className="admin-split-form">
                  <label className="admin-split-label" htmlFor="split-amount">
                    Montant envoyé à l&apos;acheteur (le reste est libéré au vendeur, moins commission)
                  </label>
                  <input
                    id="split-amount"
                    type="number"
                    min={1}
                    max={selectedDispute.total - 1}
                    className="input-field input-compact"
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(e.target.value)}
                    placeholder={`Max ${selectedDispute.total - 1} FCFA`}
                  />
                  <button
                    type="button"
                    className="admin-arbitrage-split"
                    disabled={resolving !== null || !Number(splitAmount)}
                    onClick={() => setPendingDecision({ action: "split", refundAmount: Number(splitAmount) })}
                  >
                    {resolving === selectedDispute.id + "split" ? (
                      <>
                        <span className="btn-spinner" aria-hidden="true" />
                        En cours…
                      </>
                    ) : (
                      "Vérifier le partage"
                    )}
                  </button>
                </div>
              )}
              </>
              )}
            </div>
        </DetailPanel>
      )}

      {lightboxUrl && (
        <div className="admin-lightbox" onClick={() => setLightboxUrl(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="Preuve litige" onClick={(e) => e.stopPropagation()} />
          <button type="button" className="admin-lightbox-close" onClick={() => setLightboxUrl(null)}>
            ×
          </button>
        </div>
      )}
    </>
  );
}
