"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowRight, BadgeCheck, Smartphone, Users } from "lucide-react";
import { DisputeDialog } from "@/components/marketing/DisputeDialog";
import { LandingPaymentMockup } from "@/components/marketing/LandingPaymentMockup";

const TITLE_WORDS = ["Payez", "les", "yeux", "fermés."];
const EASE = [0.22, 1, 0.36, 1] as const;

export function LandingHero() {
  const reduce = useReducedMotion();
  const [disputeOpen, setDisputeOpen] = useState(false);

  return (
    <section className="lp-hero">
      <div className="lp-container lp-hero-grid">
        <div className="lp-hero-left">
          <motion.span
            className="lp-eyebrow"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            Numéro un du paiement de confiance au Sénégal
          </motion.span>

          <h1 className="lp-h1 serif">
            {TITLE_WORDS.map((word, i) => (
              <motion.span
                key={word}
                className="lp-word"
                initial={reduce ? false : { opacity: 0, y: 22 }}
                animate={reduce ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.1 + i * 0.12 }}
              >
                {word === "fermés." ? (
                  <>
                    fermés<span className="lp-dot">.</span>
                  </>
                ) : (
                  word
                )}
                {i < TITLE_WORDS.length - 1 ? "\u00A0" : ""}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="lp-sub"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
          >
            L&apos;argent reste protégé chez XaalisPay jusqu&apos;à ce que vous validiez la
            livraison. Wave, Orange Money, zéro mauvaise surprise.
          </motion.p>

          <motion.div
            className="lp-cta-row"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.6 }}
          >
            <Link href="/auth?mode=signup" className="lp-btn lp-btn-primary">
              Créer un compte
              <ArrowRight size={18} strokeWidth={1.75} />
            </Link>
            <button
              type="button"
              className="lp-btn lp-btn-ghost"
              onClick={() => setDisputeOpen(true)}
            >
              <AlertTriangle size={18} strokeWidth={1.5} />
              Ouvrir un litige
            </button>
          </motion.div>

          <motion.div
            className="lp-trust"
            initial={reduce ? false : { opacity: 0 }}
            animate={reduce ? {} : { opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.72 }}
          >
            <span className="lp-trust-item">
              <BadgeCheck size={16} strokeWidth={1.5} />
              Conforme BCEAO
            </span>
            <span className="lp-trust-item">
              <Smartphone size={16} strokeWidth={1.5} />
              Wave · Orange Money
            </span>
            <span className="lp-trust-item">
              <Users size={16} strokeWidth={1.5} />
              +2 400 vendeurs
            </span>
          </motion.div>
        </div>

        <div className="lp-hero-right">
          <LandingPaymentMockup />
        </div>
      </div>
      <DisputeDialog open={disputeOpen} onClose={() => setDisputeOpen(false)} />
    </section>
  );
}
