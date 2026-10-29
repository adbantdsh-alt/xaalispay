"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 1600;

/** Nombre qui monte de 0 à `value` quand il entre à l'écran. La valeur
 * finale est toujours dans le HTML (texte masqué visuellement) pour le SEO
 * et les lecteurs d'écran ; la partie animée est aria-hidden. */
export function CountUp({ value, prefix = "", className = "" }: { value: number; prefix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Départ à 0 dès l'hydratation (le HTML serveur porte la valeur finale).
    setShown(0);
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION_MS);
          const eased = 1 - Math.pow(1 - t, 3);
          setShown(Math.round(value * eased));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">
        {prefix}
        {value}
      </span>
      <span aria-hidden className="tabular-nums">
        {prefix}
        {shown.toLocaleString("fr-FR")}
      </span>
    </span>
  );
}
