/** Icônes SVG premium — remplace les emojis */

const defaults = ({ size = 20, className = "" }: { size?: number; className?: string }) => ({
  width: size,
  height: size,
  className,
  "aria-hidden": true as const,
});

export function IconLock({ size = 16, className = "" }: { size?: number; className?: string }) {
  const p = defaults({ size, className });
  return (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}

export function IconShield({ size = 20, className = "" }: { size?: number; className?: string }) {
  const p = defaults({ size, className });
  return (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPackage({ size = 20, className = "" }: { size?: number; className?: string }) {
  const p = defaults({ size, className });
  return (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 7.5l9-4.5 9 4.5-9 4.5-9-4.5z" strokeLinejoin="round" />
      <path d="M3 7.5V16.5l9 4.5 9-4.5V7.5" strokeLinejoin="round" />
      <path d="M12 12v9" />
    </svg>
  );
}

export function IconKey({ size = 20, className = "" }: { size?: number; className?: string }) {
  const p = defaults({ size, className });
  return (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="4" />
      <path d="M12 12l8 8" strokeLinecap="round" />
      <path d="M17 17l3 3" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck({ size = 20, className = "" }: { size?: number; className?: string }) {
  const p = defaults({ size, className });
  return (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconArrowRight({ size = 18, className = "" }: { size?: number; className?: string }) {
  const p = defaults({ size, className });
  return (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMenu({ size = 22, className = "" }: { size?: number; className?: string }) {
  const p = defaults({ size, className });
  return (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function IconGlobe({ size = 20, className = "" }: { size?: number; className?: string }) {
  const p = defaults({ size, className });
  return (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
    </svg>
  );
}

export function IconSmartphone({ size = 20, className = "" }: { size?: number; className?: string }) {
  const p = defaults({ size, className });
  return (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 17h2" strokeLinecap="round" />
    </svg>
  );
}

export function IconWallet({ size = 20, className = "" }: { size?: number; className?: string }) {
  const p = defaults({ size, className });
  return (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 7h14a2 2 0 0 1 2 2v9H6a2 2 0 0 1-2-2V7z" />
      <path d="M16 12h5v3h-5a2 2 0 0 1 0-4z" />
    </svg>
  );
}

export function IconWave({ size = 20, className = "" }: { size?: number; className?: string }) {
  const p = defaults({ size, className });
  return (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose({ size = 22, className = "" }: { size?: number; className?: string }) {
  const p = defaults({ size, className });
  return (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function IconAlert({ size = 20, className = "" }: { size?: number; className?: string }) {
  const p = defaults({ size, className });
  return (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
      <path d="M10.3 4.2L2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconUndo({ size = 20, className = "" }: { size?: number; className?: string }) {
  const p = defaults({ size, className });
  return (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 14L4 9l5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 9h11a5 5 0 0 1 0 10H11" strokeLinecap="round" />
    </svg>
  );
}
