/** Bloc protection XaalisPay — design validé, ne pas modifier. */
"use client";

import s from "./PayProtectionBlock.module.css";

export function PayProtectionBlock({ protectionMinutes = 30 }: { protectionMinutes?: number }) {
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
      <div className={s.header}>
        <span className={s.icon} aria-hidden="true">
          🛡️
        </span>
        <div className={s.headerText}>
          <p className={s.kicker}>Protection XaalisPay</p>
          <h2 className={s.title}>Zéro arnaque. Vous restez maître de votre argent.</h2>
        </div>
      </div>

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
    </section>
  );
}
