"use client";

import { useEffect, useRef, useState } from "react";

export function useCounter(target: number, duration = 1800) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (t: number) => {
              const p = Math.min(1, (t - start) / duration);
              const eased = 1 - Math.pow(1 - p, 3);
              setVal(Math.round(target * eased));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [target, duration]);
  return { val, ref };
}

export function StatBox({ v, suffix, label }: { v: number; suffix: string; label: string }) {
  const { val, ref } = useCounter(v);
  return (
    <div className="bg-white p-8">
      <div
        className="text-[#1E3A5F] text-[44px] md:text-[56px] leading-none"
        style={{ fontWeight: 500, letterSpacing: "-0.02em" }}
      >
        <span ref={ref}>{val}</span>
        <span className="text-[#D4A373]">{suffix}</span>
      </div>
      <div className="mt-3 text-[13px] text-[#6B7280] max-w-[28ch]">{label}</div>
    </div>
  );
}
