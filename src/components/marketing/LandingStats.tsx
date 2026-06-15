"use client";

import { Reveal } from "@/components/marketing/Reveal";
import { CountUp } from "@/components/marketing/CountUp";

const STATS = [
  { value: 12, suffix: " M", accent: " FCFA", label: "sécurisés ce mois en séquestre" },
  { value: 2400, suffix: "+", accent: "", label: "vendeurs actifs au Sénégal" },
  { value: 98, suffix: " %", accent: "", label: "de livraisons validées sans litige" },
];

export function LandingStats() {
  return (
    <section className="lp-stats">
      <div className="lp-container lp-stats-grid">
        {STATS.map((stat, i) => (
          <Reveal key={stat.label} className="lp-stat" delay={i * 0.08}>
            <p className="lp-stat-num serif">
              <CountUp to={stat.value} suffix={stat.suffix} />
              {stat.accent ? <span className="lp-stat-accent">{stat.accent}</span> : null}
            </p>
            <p className="lp-stat-label">{stat.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
