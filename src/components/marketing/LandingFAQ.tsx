"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";
import { LANDING_FAQ } from "@/lib/faq";

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
          {LANDING_FAQ.map((item, i) => {
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
