"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const FAQ = [
  {
    q: "Combien coûte XaalisPay ?",
    a: "L'inscription et la création de boutique sont gratuites. Une petite commission est prélevée uniquement lorsqu'une transaction est validée et libérée — vous ne payez jamais à l'avance.",
  },
  {
    q: "Que se passe-t-il si le vendeur n'envoie jamais le colis ?",
    a: "L'argent n'est jamais versé au vendeur tant que vous n'avez pas validé la réception. En l'absence de livraison dans les délais, vous êtes intégralement remboursé.",
  },
  {
    q: "Mes données bancaires sont-elles partagées avec le vendeur ?",
    a: "Jamais. Vous payez via Wave ou Orange Money, et le vendeur ne voit aucune information de paiement. XaalisPay agit comme tiers de confiance.",
  },
  {
    q: "Quand le vendeur reçoit-il son argent ?",
    a: "Dès que le livreur valide le code PIN à la réception, puis à l'issue du Séquestre Flash de 30 minutes sans litige, les fonds sont libérés instantanément.",
  },
  {
    q: "Dois-je créer un compte ou télécharger une application ?",
    a: "Non. En tant qu'acheteur, vous payez en un clic via Wave, Orange Money ou Free Money, sans inscription ni application.",
  },
  {
    q: "Comment ouvrir un litige ?",
    a: "Après réception, vous disposez de 30 minutes pour signaler un problème depuis le suivi de commande. Notre équipe examine les preuves et tranche rapidement.",
  },
];

export function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="lp-section lp-faq" id="faq">
      <div className="lp-container">
        <Reveal className="lp-section-head">
          <p className="lp-kicker">Questions fréquentes</p>
          <h2 className="lp-h2 serif">Tout ce qu&apos;il faut savoir, sans jargon.</h2>
        </Reveal>

        <div className="lp-faq-list">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} className={`lp-faq-item ${isOpen ? "is-open" : ""}`} delay={i * 0.04}>
                <button
                  type="button"
                  className="lp-faq-q"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  {item.q}
                  <ChevronDown size={20} strokeWidth={1.5} />
                </button>
                <div className="lp-faq-a">
                  <p className="lp-faq-a-inner">{item.a}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
