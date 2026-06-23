/**
 * XaalisPay signature icon set.
 * Original geometry — not Lucide / Feather / Tabler.
 * Common DNA across the family:
 *   • 24x24 viewBox, currentColor
 *   • round caps/joins, stroke 1.6
 *   • a small accent dot (the "trust dot") in most icons
 *   • slightly asymmetric, architectural silhouettes
 */
import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number | string };

const base = (p: IconProps) => ({
  width: p.size ?? 24,
  height: p.size ?? 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

/* Shield — pentagonal crest with inner notch + trust dot */
export const IconShield = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 4.8 5.4v5.2c0 4.4 3 8 7.2 10.2 4.2-2.2 7.2-5.8 7.2-10.2V5.4L12 3Z" />
    <path d="M9.2 11.6 12 14.4l3.8-4.2" />
    <circle cx="12" cy="6.6" r="0.7" fill="currentColor" stroke="none" />
  </svg>
);

/* Lock — squared shackle, slot keyhole, accent rivet */
export const IconLock = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5.5 11h13a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V12a1 1 0 0 1 1-1Z" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    <path d="M12 14.2v3" />
    <circle cx="12" cy="14.2" r="1" fill="currentColor" stroke="none" />
    <circle cx="6.5" cy="12.8" r="0.45" fill="currentColor" stroke="none" />
  </svg>
);

/* Wallet — folded silhouette with a hinged tab, coin slot dot */
export const IconWallet = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 8.2c0-1 .8-1.8 1.8-1.8h10.4c.6 0 1 .4 1 1v1.6" />
    <path d="M4.5 8.2v9.4c0 1.2 1 2.2 2.2 2.2h11c.7 0 1.3-.6 1.3-1.3V11c0-.7-.6-1.3-1.3-1.3H6.7c-1.2 0-2.2-.7-2.2-1.5Z" />
    <path d="M15.5 14.8h2.8" />
    <circle cx="14.4" cy="14.8" r="0.7" fill="currentColor" stroke="none" />
  </svg>
);

/* Banknote — note with an off-center value chip instead of generic center circle */
export const IconBanknote = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 7.5h17a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-17a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5Z" />
    <path d="M7 10.5h3.5v3H7z" />
    <path d="M13.5 13.5h4" />
    <path d="M13.5 11h2.5" />
    <circle cx="19" cy="9.5" r="0.55" fill="currentColor" stroke="none" />
  </svg>
);

/* Package — isometric cube with seam + tape strip */
export const IconPackage = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.3 4 7v9.6L12 20.7 20 16.6V7L12 3.3Z" />
    <path d="M4 7l8 4.1L20 7" />
    <path d="M12 11.1v9.6" />
    <path d="M8 5.1v3.6l3.5 1.8" />
    <path d="M16 5.1 8 9" strokeDasharray="0 0" opacity="0" />
    <path d="M12 11.1 12 13" strokeWidth="2.4" />
  </svg>
);

/* Truck — boxy van with cargo lines and a single visible wheel hub */
export const IconTruck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2.5 8.2c0-.6.5-1.2 1.2-1.2h9.6c.6 0 1.2.5 1.2 1.2v8H2.5z" />
    <path d="M14.5 11h3.4c.4 0 .8.2 1 .5l1.9 2.5c.1.2.2.4.2.6v1.6h-6.5z" />
    <path d="M5 10.5h6" />
    <path d="M5 13h4" />
    <circle cx="7" cy="17.2" r="1.6" />
    <circle cx="17" cy="17.2" r="1.6" />
    <circle cx="7" cy="17.2" r="0.4" fill="currentColor" stroke="none" />
    <circle cx="17" cy="17.2" r="0.4" fill="currentColor" stroke="none" />
  </svg>
);

/* Clock — squared 12 o'clock tick + diagonal hands, single hour pip */
export const IconClock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M12 4.5v1.6" />
    <path d="M12 12 8.6 12" />
    <path d="M12 12l3-3.2" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

/* User — squared shoulders, head sits slightly offset for character */
export const IconUser = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4.5a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8Z" />
    <path d="M4.6 20c.6-3.4 3.8-5.5 7.4-5.5s6.8 2.1 7.4 5.5" />
    <path d="M4.6 20h14.8" />
  </svg>
);

/* Store — striped awning (alt stripes via fill dots) + door cutout */
export const IconStore = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 9 5.6 5h12.8L20 9" />
    <path d="M4 9h16v2.4a2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2z" />
    <path d="M5.5 13.4V20h13v-6.6" />
    <path d="M10.5 20v-4.4h3V20" />
    <circle cx="12" cy="17.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

/* Check — single confident stroke, slightly extended tail */
export const IconCheck = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={p.strokeWidth ?? 2.2}>
    <path d="m4.8 12.6 4.6 4.6L19.6 7" />
  </svg>
);

/* X — slightly tapered close */
export const IconX = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={p.strokeWidth ?? 1.8}>
    <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
  </svg>
);

/* Plus — squared with mid dot accent */
export const IconPlus = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={p.strokeWidth ?? 1.8}>
    <path d="M12 5.5v13M5.5 12h13" />
  </svg>
);

export const IconMinus = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={p.strokeWidth ?? 1.8}>
    <path d="M5.5 12h13" />
  </svg>
);

/* Menu — three bars, middle one shorter for signature */
export const IconMenu = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={p.strokeWidth ?? 1.8}>
    <path d="M4.5 7.5h15" />
    <path d="M4.5 12h10" />
    <path d="M4.5 16.5h15" />
  </svg>
);

/* Arrow Right — long shaft + open chevron, no closed triangle */
export const IconArrowRight = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={p.strokeWidth ?? 1.8}>
    <path d="M3.5 12h15" />
    <path d="m13 6.5 5.5 5.5-5.5 5.5" />
  </svg>
);

/* Sparkle — four-point diamond star with a tiny satellite, original silhouette */
export const IconSparkle = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M11 3.5c.6 4 2.5 5.9 6.5 6.5-4 .6-5.9 2.5-6.5 6.5-.6-4-2.5-5.9-6.5-6.5 4-.6 5.9-2.5 6.5-6.5Z" />
    <circle cx="18.5" cy="17.5" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);
