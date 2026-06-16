"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { formatAdminDate, type DisputeRow } from "./admin-types";

export function AdminDisputesSection({
  disputes,
  resolving,
  onResolve,
  onActivityChange,
}: {
  disputes: DisputeRow[];
  resolving: string | null;
  onResolve: (disputeId: string, action: "refund" | "release", force?: boolean) => Promise<boolean>;
  onActivityChange?: (busy: boolean) => void;
}) {
  const [selectedDispute, setSelectedDispute] = useState<DisputeRow | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    onActivityChange?.(!!selectedDispute || !!lightboxUrl);
  }, [selectedDispute, lightboxUrl, onActivityChange]);

  const openDispute = (dispute: DisputeRow) => setSelectedDispute(dispute);

  const resolve = async (disputeId: string, action: "refund" | "release", force = false) => {
    const ok = await onResolve(disputeId, action, force);
    if (ok) setSelectedDispute(null);
  };

  return (
    <>
      <section className="admin-section">
        {disputes.length === 0 ? (
          <p className="admin-empty">Aucun litige ouvert — bonne nouvelle.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Vendeur</th>
                  <th>Acheteur</th>
                  <th>Montant</th>
                  <th>Ouvert le</th>
                  <th>Raison</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.slug}</strong>
                      <span className="admin-cell-sub">{d.productName}</span>
                    </td>
                    <td>
                      @{d.sellerUsername}
                      {d.sellerPhone && (
                        <span className="admin-cell-sub">
                          <a href={`tel:${d.sellerPhone}`}>{d.sellerPhone}</a>
                        </span>
                      )}
                    </td>
                    <td>
                      {d.clientName}
                      <span className="admin-cell-sub">
                        <a href={`tel:${d.clientPhone}`}>{d.clientPhone}</a>
                      </span>
                    </td>
                    <td>{formatCurrency(d.total)}</td>
                    <td>{formatAdminDate(d.disputeOpenedAt)}</td>
                    <td className="admin-dispute-reason">
                      {d.disputeReason ? (
                        d.disputeReason.slice(0, 60) + (d.disputeReason.length > 60 ? "…" : "")
                      ) : (
                        <em>Non précisée</em>
                      )}
                      {d.disputeMedia.length > 0 && (
                        <span className="admin-badge warn">{d.disputeMedia.length} preuve(s)</span>
                      )}
                    </td>
                    <td>
                      <button type="button" className="admin-action-btn" onClick={() => openDispute(d)}>
                        Arbitrer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedDispute && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedDispute(null)}>
          <article className="admin-modal admin-modal--dispute" onClick={(e) => e.stopPropagation()}>
            <header className="admin-modal-head">
              <h2>Litige #{selectedDispute.slug}</h2>
              <button type="button" className="admin-modal-close" onClick={() => setSelectedDispute(null)}>
                ×
              </button>
            </header>

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Motif du litige</h3>
              <p className="admin-dispute-text">
                {selectedDispute.disputeReason || <em>Non précisé par l&apos;acheteur</em>}
              </p>
            </div>

            {selectedDispute.disputeMedia.length > 0 && (
              <div className="admin-dispute-section">
                <h3 className="admin-dispute-section-title">
                  Preuves ({selectedDispute.disputeMedia.length})
                </h3>
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
              </div>
            )}

            <div className="admin-dispute-section admin-dispute-contacts">
              <div className="admin-contact-card">
                <p className="admin-contact-role">Acheteur</p>
                <p className="admin-contact-name">{selectedDispute.clientName}</p>
                <div className="admin-contact-actions">
                  <a href={`tel:${selectedDispute.clientPhone}`} className="admin-contact-btn admin-contact-call">
                    Appeler
                  </a>
                  <a
                    href={`https://wa.me/${selectedDispute.clientPhone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-contact-btn admin-contact-wa"
                  >
                    WhatsApp
                  </a>
                </div>
                {selectedDispute.clientAddress && (
                  <p className="admin-contact-sub">{selectedDispute.clientAddress}</p>
                )}
              </div>

              <div className="admin-contact-card">
                <p className="admin-contact-role">Vendeur</p>
                <p className="admin-contact-name">
                  {selectedDispute.sellerName}
                  <span className="admin-cell-sub"> @{selectedDispute.sellerUsername}</span>
                </p>
                {selectedDispute.sellerPhone ? (
                  <div className="admin-contact-actions">
                    <a href={`tel:${selectedDispute.sellerPhone}`} className="admin-contact-btn admin-contact-call">
                      Appeler
                    </a>
                    <a
                      href={`https://wa.me/${selectedDispute.sellerPhone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-contact-btn admin-contact-wa"
                    >
                      WhatsApp
                    </a>
                  </div>
                ) : (
                  <p className="admin-contact-sub">Téléphone non renseigné</p>
                )}
              </div>
            </div>

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Chronologie</h3>
              <ol className="admin-timeline">
                <li>
                  <span className="admin-timeline-dot" />
                  <span className="admin-timeline-label">Commande créée</span>
                  <span className="admin-timeline-date">{formatAdminDate(selectedDispute.createdAt)}</span>
                </li>
                {selectedDispute.paidAt && (
                  <li>
                    <span className="admin-timeline-dot admin-timeline-dot--ok" />
                    <span className="admin-timeline-label">
                      Paiement confirmé ({selectedDispute.paymentMethod})
                    </span>
                    <span className="admin-timeline-date">{formatAdminDate(selectedDispute.paidAt)}</span>
                  </li>
                )}
                {selectedDispute.clientDeliveryConfirmedAt && (
                  <li>
                    <span className="admin-timeline-dot admin-timeline-dot--ok" />
                    <span className="admin-timeline-label">Réception confirmée par l&apos;acheteur</span>
                    <span className="admin-timeline-date">
                      {formatAdminDate(selectedDispute.clientDeliveryConfirmedAt)}
                    </span>
                  </li>
                )}
                {selectedDispute.disputeOpenedAt && (
                  <li>
                    <span className="admin-timeline-dot admin-timeline-dot--bad" />
                    <span className="admin-timeline-label">Litige ouvert</span>
                    <span className="admin-timeline-date">{formatAdminDate(selectedDispute.disputeOpenedAt)}</span>
                  </li>
                )}
              </ol>
            </div>

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Montants</h3>
              <dl className="admin-detail-list">
                <div>
                  <dt>Total commande</dt>
                  <dd>{formatCurrency(selectedDispute.total)}</dd>
                </div>
                <div>
                  <dt>Frais protection acheteur</dt>
                  <dd>{formatCurrency(selectedDispute.buyerProtectionFee)}</dd>
                </div>
              </dl>
            </div>

            <div className="admin-dispute-section admin-arbitrage">
              <h3 className="admin-dispute-section-title">Décision arbitrage</h3>
              <p className="admin-arbitrage-warn">
                Action irréversible — vérifiez les preuves et contactez les parties avant de trancher.
              </p>
              <div className="admin-arbitrage-actions">
                <button
                  type="button"
                  className="admin-arbitrage-btn admin-arbitrage-refund"
                  disabled={resolving !== null}
                  onClick={() => resolve(selectedDispute.id, "refund")}
                >
                  {resolving === selectedDispute.id + "refund" ? (
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
                  onClick={() => resolve(selectedDispute.id, "release")}
                >
                  {resolving === selectedDispute.id + "release" ? (
                    <>
                      <span className="btn-spinner" aria-hidden="true" />
                      En cours…
                    </>
                  ) : (
                    "Libérer au vendeur"
                  )}
                </button>
              </div>
            </div>
          </article>
        </div>
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
