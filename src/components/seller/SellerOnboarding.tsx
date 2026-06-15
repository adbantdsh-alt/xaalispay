"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconCheck } from "@/components/ui/AppIcon";

const STEPS = [
  { id: "product", label: "Créer un produit", href: "/create" },
  { id: "share", label: "Partager votre lien", href: "/create" },
  { id: "order", label: "Recevoir une commande", href: "/dashboard" },
  { id: "validate", label: "Valider une livraison", href: "/dashboard" },
] as const;

export function SellerOnboarding({
  productCount,
  orderCount,
  hasValidatedDelivery,
}: {
  productCount: number;
  orderCount: number;
  hasValidatedDelivery: boolean;
}) {
  const [shared, setShared] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const sync = () => {
      try {
        setShared(localStorage.getItem("xp_onboarding_shared") === "1");
        setDismissed(localStorage.getItem("xp_onboarding_dismissed") === "1");
      } catch {
        /* ignore */
      }
    };
    sync();
    window.addEventListener("focus", sync);
    const id = setInterval(sync, 2000);
    return () => {
      window.removeEventListener("focus", sync);
      clearInterval(id);
    };
  }, []);

  const completed = {
    product: productCount > 0,
    share: shared,
    order: orderCount > 0,
    validate: hasValidatedDelivery,
  };

  const doneCount = Object.values(completed).filter(Boolean).length;
  const allDone = doneCount === STEPS.length;

  useEffect(() => {
    if (allDone) {
      try {
        localStorage.setItem("xp_onboarding_dismissed", "1");
      } catch {
        /* ignore */
      }
    }
  }, [allDone]);

  if (dismissed || allDone) return null;

  const nextStep = STEPS.find((s) => !completed[s.id]);

  return (
    <section className="onboarding-card animate-fade-up">
      <div className="onboarding-header">
        <p className="label">Premiers pas</p>
        <span className="onboarding-progress">{doneCount}/{STEPS.length}</span>
      </div>
      <div className="onboarding-bar">
        <div className="onboarding-bar-fill" style={{ width: `${(doneCount / STEPS.length) * 100}%` }} />
      </div>
      <ul className="onboarding-steps">
        {STEPS.map((step) => (
          <li
            key={step.id}
            className={`onboarding-step ${completed[step.id] ? "onboarding-step-done" : ""} ${nextStep?.id === step.id ? "onboarding-step-next" : ""}`}
          >
            <span className="onboarding-step-icon">
              {completed[step.id] ? <IconCheck size={12} /> : <span className="onboarding-step-pending" />}
            </span>
            {step.label}
          </li>
        ))}
      </ul>
      {nextStep && (
        <Link href={nextStep.href} className="btn-teal onboarding-cta">
          Continuer : {nextStep.label}
        </Link>
      )}
      <button
        type="button"
        className="btn-ghost onboarding-dismiss"
        onClick={() => {
          setDismissed(true);
          try {
            localStorage.setItem("xp_onboarding_dismissed", "1");
          } catch {
            /* ignore */
          }
        }}
      >
        Masquer
      </button>
    </section>
  );
}
