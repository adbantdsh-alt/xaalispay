"use client";

import Link from "next/link";
import { IconArrowRight, IconUser } from "@/components/icons";
import { Reveal } from "@/components/marketing/Reveal";

export function LandingStory() {
  return (
    <section className="bg-white py-16 md:py-24 lp-hairline-t">
      <div className="lp-container">
        <Reveal className="max-w-3xl">
          <div className="lp-eyebrow">Mot du co-fondateur</div>
          <h2 className="lp-h2 mt-4">Pourquoi XaalisPay existe.</h2>
        </Reveal>

        <div className="mt-10 md:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <Reveal className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden lp-hairline bg-[#0B1B33] aspect-[4/5] flex items-end">
              <div className="absolute inset-0 flex items-center justify-center text-white/20">
                <IconUser size={96} />
              </div>
              <div className="relative w-full p-4 md:p-5 bg-gradient-to-t from-[#0B1B33] via-[#0B1B33]/70 to-transparent">
                <div className="text-white text-[18px] md:text-[20px] leading-tight">Mr Abdoulaye Badji</div>
                <div className="text-white/70 text-[12px] md:text-[13px] mt-0.5">Co-fondateur · XaalisPay</div>
              </div>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-7 space-y-5" delay={0.1}>
            <blockquote className="text-[19px] md:text-[24px] text-[#1E3A5F] leading-[1.35]">
              « J&apos;ai généré des <span className="text-[#D4A373]">dizaines de millions</span> de FCFA de
              chiffre d&apos;affaires sur le marché africain. J&apos;en ai perdu également des{" "}
              <span className="text-[#D4A373]">dizaines de millions</span> à cause de commandes non honorées
              et de clients oiseaux. »
            </blockquote>

            <div className="space-y-3.5 text-[15px] md:text-[16px] leading-[1.7] text-[#1E3A5F]/80">
              <p>
                XaalisPay est né de cette réalité. Créé par un e-commerçant qui a connu le terrain, les
                arnaques, les pertes.
              </p>
              <p>
                En Afrique, les processeurs de paiement existent déjà — Wave, Orange Money, Free Money. Ce qui
                manque, c&apos;est un <strong className="text-[#1E3A5F]">tiers de confiance</strong>. Un outil
                qui rassure les utilisateurs et les pousse à payer en mobile money sans crainte.
              </p>
              <p>
                Parce qu&apos;une fois que les acheteurs n&apos;ont plus peur de payer, l&apos;e-commerce
                africain peut exploser — multiplier par 3, par 5, par 10 dans les années à venir. Et faire
                émerger une nouvelle génération d&apos;entrepreneurs africains qui n&apos;ont plus peur de
                vendre ou d&apos;acheter en ligne.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/histoire"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#1E3A5F] lp-text-white text-[14px] font-semibold hover:bg-[#15294a] transition-colors"
              >
                Lire toute l&apos;histoire
                <IconArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
