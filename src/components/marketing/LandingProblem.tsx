"use client";

import type { ReactNode } from "react";
import { IconStore, IconUser } from "@/components/icons";
import { Reveal } from "@/components/marketing/Reveal";
import { StatBox } from "@/components/marketing/StatBox";

const SELLER_PAINS = [
  "Faux rendez-vous",
  "Clients qui changent d'avis",
  "Livraisons inutiles",
  "Temps perdu",
  "Argent bloqué",
];
const BUYER_PAINS = [
  "Peu de garanties",
  "Produits différents des photos",
  "Difficulté à se faire rembourser",
  "Absence de recours structuré",
];
const STATS = [
  { v: 99, suffix: "%", label: "des vendeurs ont déjà subi une commande non honorée" },
  { v: 80, suffix: "%", label: "des acheteurs hésitent à payer avant livraison" },
  { v: 2, suffix: "h", label: "perdues en moyenne par livraison en retard" },
];

export function LandingProblem() {
  return (
    <section id="probleme" className="lp-surface-gray py-20 md:py-24">
      <div className="lp-container">
        <Reveal className="max-w-3xl">
          <div className="lp-eyebrow">Le problème</div>
          <h2 className="lp-h2 mt-4">Le paiement à la livraison coûte cher à tout le monde.</h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-5">
          <ProblemCard tag="Pour les vendeurs" icon={<IconStore size={20} />} items={SELLER_PAINS} />
          <ProblemCard tag="Pour les acheteurs" icon={<IconUser size={20} />} items={BUYER_PAINS} />
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-px bg-[#e3e7ee] lp-hairline">
          {STATS.map((s, i) => (
            <StatBox key={i} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemCard({ tag, icon, items }: { tag: string; icon: ReactNode; items: string[] }) {
  return (
    <Reveal className="lp-card-flat p-8 bg-white" as="div">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-[#F5F5F5] grid place-items-center text-[#1E3A5F]">{icon}</div>
        <div className="lp-eyebrow">{tag}</div>
      </div>
      <ul className="mt-6 space-y-3">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-3 text-[15px] text-[#1E3A5F]">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#D4A373] shrink-0" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
