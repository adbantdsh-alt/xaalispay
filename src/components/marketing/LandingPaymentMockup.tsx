"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, ShieldCheck } from "lucide-react";

const TIMELINE = [
  { label: "Payé", done: true },
  { label: "Séquestre", done: true },
  { label: "Livré", done: false },
  { label: "Libéré", done: false },
];

export function LandingPaymentMockup() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="lp-mockup-wrap"
      initial={reduce ? false : { opacity: 0, x: 28, scale: 0.97 }}
      animate={reduce ? {} : { opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
    >
      <div className="lp-mini-card" aria-hidden="true">
        <p className="lp-mini-title">Suivi du paiement</p>
        <div className="lp-mini-steps">
          {TIMELINE.map((s) => (
            <div key={s.label} className={`lp-mini-step ${s.done ? "" : "is-pending"}`}>
              <span className="lp-mini-tick">{s.done ? <Check size={11} strokeWidth={2.5} /> : null}</span>
              {s.label}
            </div>
          ))}
        </div>
      </div>

      <div className="lp-phone" role="img" aria-label="Écran de paiement en séquestre XaalisPay">
        <div className="lp-phone-screen">
          <div className="lp-phone-notch" aria-hidden="true" />
          <div className="lp-phone-top">
            <span className="lp-phone-brand">
              <ShieldCheck size={15} strokeWidth={1.6} />
              XaalisPay
            </span>
            <span>Paiement sécurisé</span>
          </div>

          <p className="lp-phone-amount-label">Montant à payer</p>
          <p className="lp-phone-amount serif">24 500 F</p>

          <div className="lp-phone-vendor">
            <span className="lp-phone-avatar">AM</span>
            <span>
              <span className="lp-phone-vendor-name">@awa.mode</span>
              <br />
              <span className="lp-phone-vendor-meta">Boutique mode · Dakar</span>
            </span>
          </div>

          <div className="lp-phone-methods">
            <span className="lp-phone-method">
              <span className="lp-dot-wave" aria-hidden="true" />
              Wave
            </span>
            <span className="lp-phone-method">
              <span className="lp-dot-om" aria-hidden="true" />
              Orange Money
            </span>
          </div>

          <div className="lp-escrow-badge">
            <span className="lp-escrow-dot" aria-hidden="true" />
            <span>
              <span className="lp-escrow-text">Séquestre actif</span>
              <br />
              <span className="lp-escrow-sub">Libéré à la livraison validée</span>
            </span>
          </div>

          <div className="lp-phone-cta">Payer les yeux fermés</div>
        </div>
      </div>
    </motion.div>
  );
}
