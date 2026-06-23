"use client";

import { useState } from "react";
import { IconPlus, IconMinus } from "@/components/icons";
import { LANDING_FAQ } from "@/lib/faq";

const EXTRA_FAQ = [
  {
    q: "Dans quels pays XaalisPay fonctionne-t-il ?",
    a: "XaalisPay est actuellement disponible au Sénégal, avec un déploiement progressif prévu dans le reste de l'Afrique de l'Ouest.",
  },
  {
    q: "Quels moyens de paiement sont acceptés ?",
    a: "Wave, Orange Money et Free Money. D'autres moyens de paiement pourront être ajoutés à l'avenir.",
  },
];

const ALL_FAQ = [...LANDING_FAQ, ...EXTRA_FAQ];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <article className="content-page">
      <header className="content-hero">
        <p className="section-label">FAQ</p>
        <h1 className="content-title">Questions fréquentes</h1>
        <p className="content-lead">
          Tout ce que vous devez savoir avant de payer ou de vendre avec XaalisPay.
        </p>
      </header>

      <div className="lp-hairline-t lp-hairline-b" style={{ marginTop: "2.5rem" }}>
        {ALL_FAQ.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className={i > 0 ? "lp-hairline-t" : ""}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 text-left py-5"
                aria-expanded={isOpen}
              >
                <span className="text-[16px] md:text-[17px] font-medium text-[#1E3A5F]">{item.q}</span>
                <span className="h-8 w-8 rounded-full bg-[#1E3A5F]/5 grid place-items-center text-[#1E3A5F] shrink-0">
                  {isOpen ? <IconMinus size={16} /> : <IconPlus size={16} />}
                </span>
              </button>
              {isOpen && <p className="pb-6 text-[15px] text-[#1E3A5F]/75 leading-[1.7]">{item.a}</p>}
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-[14.5px] text-[#1E3A5F]/70">
        Une autre question ? Notre équipe support est joignable du lundi au samedi, de 9h à 19h
        (GMT). Écrivez-nous via la{" "}
        <a href="/contact" className="font-semibold text-[#1E3A5F] underline underline-offset-2">
          page contact
        </a>
        .
      </p>
    </article>
  );
}
