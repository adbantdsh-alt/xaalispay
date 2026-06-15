"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";
import { Wallet, Lock, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const STEPS = [
  {
    num: "01",
    Icon: Wallet,
    title: "Vous payez",
    desc: "Wave ou Orange Money, en un clic. Sans compte, sans application à télécharger.",
  },
  {
    num: "02",
    Icon: Lock,
    title: "L'argent est gardé",
    desc: "Vos fonds restent en séquestre chez XaalisPay — jamais chez le vendeur tant que rien n'est validé.",
  },
  {
    num: "03",
    Icon: CheckCircle2,
    title: "Vous validez",
    desc: "Le livreur reçoit votre code PIN à la réception. Le vendeur est payé, vous êtes tranquille.",
  },
];

export function LandingHowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 880px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 65%"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <section className="lp-section lp-how" id="comment">
      <div className="lp-container">
        <Reveal className="lp-section-head">
          <p className="lp-kicker">Comment ça marche</p>
          <h2 className="lp-h2 serif">Trois étapes. Aucune zone grise.</h2>
        </Reveal>

        <div className="lp-timeline" ref={ref}>
          <span className="lp-timeline-track" aria-hidden="true" />
          <motion.span
            className="lp-timeline-track-fill"
            aria-hidden="true"
            style={
              reduce
                ? { scaleX: 1, scaleY: 1 }
                : isDesktop
                  ? { scaleX: progress, scaleY: 1 }
                  : { scaleX: 1, scaleY: progress }
            }
          />

          {STEPS.map((step, i) => (
            <Reveal key={step.num} className="lp-step" delay={i * 0.1}>
              <span className="lp-step-num serif">{step.num}</span>
              <span className="lp-step-icon">
                <step.Icon size={26} strokeWidth={1.25} />
              </span>
              <h3 className="lp-step-title serif">{step.title}</h3>
              <p className="lp-step-desc">{step.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
