/** Bloc protection XaalisPay — rétractable, mais ouvert par défaut pour que
 * l'acheteur voie immédiatement comment se déroule l'achat. */
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import s from "./PayProtectionBlock.module.css";
import { IconShield } from "@/components/ui/AppIcon";

export function PayProtectionBlock({ protectionMinutes = 30 }: { protectionMinutes?: number }) {
  const [expanded, setExpanded] = useState(true);

  const steps = [
    {
      title: "Paiement sécurisé",
      text: "Argent séquestré chez XaalisPay — le vendeur n'est pas payé.",
    },
    {
      title: "Réception & vérification",
      text: "Ouvrez le colis tranquillement. Rien n'est libéré tant que vous n'avez pas validé.",
    },
    {
      title: "Code au livreur",
      text: "Uniquement quand le colis vous convient. Jamais au vendeur.",
    },
    {
      title: `${protectionMinutes} min anti-arnaque`,
      text: `Après livraison, ${protectionMinutes} min pour signaler un problème. C'est vous qui décidez.`,
    },
  ];

  return (
    <section className={s.block} aria-label="Protection XaalisPay">
      <button
        type="button"
        className={s.header}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className={s.icon} aria-hidden="true">
          <IconShield size={16} />
        </span>
        <div className={s.headerText}>
          <p className={s.kicker}>Protection XaalisPay</p>
          <h2 className={s.title}>Zéro arnaque. Vous restez maître de votre argent.</h2>
        </div>
        <ChevronDown size={16} strokeWidth={1.75} className={`${s.chevron} ${expanded ? s.chevronOpen : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className={s.stepsCard}>
              <ol className={s.steps}>
                {steps.map((step, i) => (
                  <li key={step.title} className={s.step}>
                    <div className={s.stepRail}>
                      <span className={`${s.stepNum} ${i === 0 ? s.stepNumActive : ""}`}>
                        {i + 1}
                      </span>
                      {i < steps.length - 1 && <span className={s.stepLine} aria-hidden="true" />}
                    </div>
                    <div className={s.stepBody}>
                      <p className={s.stepTitle}>{step.title}</p>
                      <p className={s.stepText}>{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
