"use client";

import { useState } from "react";
import { IconPlus, IconMinus } from "@/components/icons";
import { Reveal } from "@/components/marketing/Reveal";
import { LANDING_FAQ } from "@/lib/faq";

export function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-20 md:py-24 lp-hairline-t scroll-mt-24">
      <span id="litige" className="block -mt-24 pt-24" aria-hidden />
      <div className="lp-container grid grid-cols-1 md:grid-cols-12 gap-12">
        <Reveal className="md:col-span-4">
          <div className="lp-eyebrow">FAQ</div>
          <h2 className="lp-h2 mt-4">On vous dit tout.</h2>
          <p className="mt-6 text-[15px] text-[#6B7280] leading-relaxed">
            Une question qui n&apos;est pas listée ? Notre équipe répond depuis Dakar.
          </p>
        </Reveal>
        <div className="md:col-span-8">
          <div className="lp-hairline-t">
            {LANDING_FAQ.map((it, i) => {
              const isOpen = open === i;
              return (
                <div key={it.q} className="lp-hairline-b">
                  <button
                    className="w-full flex items-start justify-between gap-6 py-6 text-left"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    <span className="text-[17px] font-medium text-[#1E3A5F]">{it.q}</span>
                    <span className="mt-1 shrink-0 text-[#1E3A5F]">
                      {isOpen ? <IconMinus size={16} /> : <IconPlus size={16} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="pb-6 pr-10 text-[15px] leading-relaxed text-[#6B7280] lp-animate-fade-in">
                      {it.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
