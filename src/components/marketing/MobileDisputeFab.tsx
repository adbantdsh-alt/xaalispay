import Link from "next/link";

export function MobileDisputeFab() {
  return (
    <Link
      href="/litige"
      aria-label="Ouvrir un litige"
      className="md:hidden fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#1E3A5F] lp-text-white shadow-[0_10px_30px_-10px_rgba(30,58,95,0.6)] pl-3 pr-4 py-3 text-[13px] font-semibold active:scale-95 transition"
    >
      <span className="grid place-items-center h-7 w-7 rounded-full bg-[#D4A373] text-white">
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </span>
      Ouvrir un litige
    </Link>
  );
}
