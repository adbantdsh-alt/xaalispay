"use client";

import { useMemo, useState } from "react";
import { Reveal } from "@/components/marketing/Reveal";
import { FEE_POLICY, simulateTransaction } from "@/lib/fees";
import { formatCurrency } from "@/lib/utils";

const PRESETS = [5_000, 10_000, 15_000, 25_000, 50_000];

export function LandingPricing() {
  const [amount, setAmount] = useState(15_000);
  const sim = useMemo(() => simulateTransaction(amount), [amount]);

  return (
    <section className="lp-section lp-pricing" id="tarifs">
      <div className="lp-container">
        <Reveal className="lp-section-head">
          <p className="lp-kicker">Tarifs transparents</p>
          <h2 className="lp-h2 serif">Pas de frais cachés. Jamais.</h2>
          <p className="lp-section-lead">
            Chaque frais est affiché avant le paiement ou le retrait. Inscription gratuite, zéro
            abonnement — vous payez uniquement quand une vente aboutit.
          </p>
        </Reveal>

        <div className="lp-pricing-grid">
          <Reveal className="lp-pricing-cards">
            <article className="lp-pricing-card glass-card">
              <p className="lp-pricing-role">Acheteur</p>
              <p className="lp-pricing-rate">{FEE_POLICY.buyer.shortLabel}</p>
              <p className="lp-pricing-name">{FEE_POLICY.buyer.label}</p>
              <p className="lp-pricing-desc">{FEE_POLICY.buyer.description}</p>
              <ul className="lp-pricing-list">
                <li>Affiché ligne par ligne au checkout</li>
                <li>Plafonné à {FEE_POLICY.buyer.capFcfa} FCFA</li>
                <li>Remboursé si commande annulée avant livraison</li>
              </ul>
            </article>

            <article className="lp-pricing-card glass-card lp-pricing-card-accent">
              <p className="lp-pricing-role">Vendeur</p>
              <p className="lp-pricing-rate">{FEE_POLICY.seller.shortLabel}</p>
              <p className="lp-pricing-name">{FEE_POLICY.seller.label}</p>
              <p className="lp-pricing-desc">{FEE_POLICY.seller.description}</p>
              <ul className="lp-pricing-list">
                <li>Boutique et XaalisTag gratuits</li>
                <li>Prélevé à la libération des fonds</li>
                <li>Rien à payer si vous ne vendez pas</li>
              </ul>
            </article>

            <article className="lp-pricing-card glass-card">
              <p className="lp-pricing-role">Retrait</p>
              <p className="lp-pricing-rate">{FEE_POLICY.payout.shortLabel}</p>
              <p className="lp-pricing-name">{FEE_POLICY.payout.label}</p>
              <p className="lp-pricing-desc">{FEE_POLICY.payout.description}</p>
              <ul className="lp-pricing-list">
                <li>Wave ou Orange Money</li>
                <li>Montant net affiché avant confirmation</li>
                <li>Pas de frais tant que vous ne retirez pas</li>
              </ul>
            </article>
          </Reveal>

          <Reveal className="lp-fee-simulator glass-card" delay={0.06}>
            <h3 className="lp-simulator-title">Simulateur de frais</h3>
            <p className="lp-simulator-lead">
              Entrez le montant d&apos;une commande (produit + livraison) pour voir exactement qui
              paie quoi.
            </p>

            <label className="lp-simulator-field">
              <span>Montant commande (FCFA)</span>
              <input
                type="number"
                min={500}
                step={500}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                className="lp-simulator-input"
              />
            </label>

            <div className="lp-simulator-presets">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`lp-simulator-preset ${amount === preset ? "is-active" : ""}`}
                  onClick={() => setAmount(preset)}
                >
                  {formatCurrency(preset)}
                </button>
              ))}
            </div>

            <dl className="lp-simulator-breakdown">
              <div className="lp-simulator-row lp-simulator-row-head">
                <dt>Étape</dt>
                <dd>Montant</dd>
              </div>
              <div className="lp-simulator-row">
                <dt>Commande (produit + livraison)</dt>
                <dd>{formatCurrency(sim.subtotal)}</dd>
              </div>
              <div className="lp-simulator-row lp-simulator-row-buyer">
                <dt>Acheteur paie en plus ({FEE_POLICY.buyer.shortLabel})</dt>
                <dd>+ {formatCurrency(sim.buyerFee)}</dd>
              </div>
              <div className="lp-simulator-row lp-simulator-row-total">
                <dt>Total payé par l&apos;acheteur</dt>
                <dd>{formatCurrency(sim.checkoutTotal)}</dd>
              </div>
              <div className="lp-simulator-divider" />
              <div className="lp-simulator-row">
                <dt>Commission vendeur ({FEE_POLICY.seller.shortLabel})</dt>
                <dd>− {formatCurrency(sim.sellerCommission)}</dd>
              </div>
              <div className="lp-simulator-row">
                <dt>Solde disponible vendeur</dt>
                <dd>{formatCurrency(sim.sellerBalance)}</dd>
              </div>
              <div className="lp-simulator-row">
                <dt>Frais retrait ({FEE_POLICY.payout.shortLabel})</dt>
                <dd>− {formatCurrency(sim.payoutFee)}</dd>
              </div>
              <div className="lp-simulator-row lp-simulator-row-highlight">
                <dt>Le vendeur reçoit sur Wave/Orange</dt>
                <dd>{formatCurrency(sim.sellerReceives)}</dd>
              </div>
            </dl>

            <p className="lp-simulator-note">
              Tous les montants sont arrondis au franc CFA. Aucun autre frais n&apos;est appliqué
              par XaalisPay.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
