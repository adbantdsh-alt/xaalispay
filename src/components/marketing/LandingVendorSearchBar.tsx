"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconShield, IconX } from "@/components/icons";
import { VendorSearch } from "@/components/marketing/VendorSearch";

export function LandingVendorSearchBar() {
  const [infoOpen, setInfoOpen] = useState(false);
  return (
    <>
      <div className="border-b border-[#E8E2D5]/60 bg-[#FBF8F2]/40">
        <div className="lp-container py-4 sm:py-5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4A373]" />
            <span className="text-[12px] sm:text-[13px] font-medium text-[#1E3A5F]">
              Trouvez votre vendeur grâce à son{" "}
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                className="italic text-[#D4A373] underline decoration-dotted underline-offset-2 hover:text-[#b8895a] transition-colors cursor-pointer"
              >
                @XaalisTag
              </button>
            </span>
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              aria-label="C'est quoi un XaalisTag ?"
              className="h-4 w-4 sm:h-[18px] sm:w-[18px] rounded-full border border-[#1E3A5F]/20 text-[10px] sm:text-[11px] font-semibold text-[#1E3A5F]/70 hover:bg-[#1E3A5F] lp-hover-white hover:border-[#1E3A5F] transition-colors grid place-items-center leading-none"
            >
              ?
            </button>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <VendorSearch />
            </div>
            <Link
              href="/litige"
              className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-full border border-[#1E3A5F]/15 bg-white text-[#1E3A5F]/80 font-medium text-[13px] py-2.5 px-4 hover:border-[#1E3A5F]/30 hover:text-[#1E3A5F] transition-colors shrink-0"
            >
              Litige
            </Link>
          </div>
        </div>
      </div>
      <XaalisTagModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </>
  );
}

function XaalisTagModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="lp-animate-fade-in fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0B1B33]/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg max-h-[88dvh] sm:max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#E8E2D5] overscroll-contain"
      >
        <div className="sticky top-0 bg-white border-b border-[#E8E2D5]/60 px-4 sm:px-6 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-[#D4A373]/15 grid place-items-center text-[#D4A373] text-xs">
              @
            </span>
            <h3 className="text-[15px] sm:text-[18px] text-[#1E3A5F] font-medium">C&apos;est quoi un XaalisTag ?</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="h-7 w-7 rounded-full hover:bg-[#1E3A5F]/5 grid place-items-center text-[#1E3A5F]/60 hover:text-[#1E3A5F] transition-colors"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-5 space-y-2.5 sm:space-y-5">
          <p className="text-[12.5px] sm:text-[14px] leading-snug sm:leading-relaxed text-[#1E3A5F]/85">
            Le <span className="font-semibold text-[#1E3A5F]">XaalisTag</span> est l&apos;identifiant unique de
            chaque vendeur — comme un <span className="italic">@username</span>. Chaque vendeur a sa boutique
            en ligne via son tag.
          </p>

          <div className="rounded-xl border border-[#E8E2D5] bg-[#FBF8F2]/60 p-3 sm:p-4">
            <div className="lp-eyebrow mb-1 text-[11px] sm:text-[12px]">Exemple concret</div>
            <p className="text-[12px] sm:text-[13px] leading-snug sm:leading-relaxed text-[#1E3A5F]/80">
              Un vendeur fait un live TikTok ou poste sur WhatsApp. Au lieu d&apos;un paiement direct risqué, il
              affiche son <span className="font-mono text-[#D4A373]">@son-tag</span>.
            </p>
          </div>

          <div>
            <div className="lp-eyebrow mb-1.5 sm:mb-3 text-[11px] sm:text-[12px]">Comment ça marche</div>
            <ol className="space-y-1.5 sm:space-y-2.5">
              {[
                "Le client copie le XaalisTag du vendeur.",
                "Il le saisit sur XaalisPay.com → la boutique s'ouvre.",
                "Il choisit son produit et paie en toute sécurité.",
                "Le vendeur a 48 h pour livrer, sinon remboursement auto.",
              ].map((step, i) => (
                <li
                  key={i}
                  className="flex gap-2 sm:gap-3 text-[12px] sm:text-[13.5px] text-[#1E3A5F]/85 leading-snug sm:leading-relaxed"
                >
                  <span className="shrink-0 h-5 w-5 rounded-full bg-[#1E3A5F] text-white text-[10px] font-semibold grid place-items-center">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl bg-[#1E3A5F] text-white p-3 sm:p-4">
            <div className="flex items-start gap-2">
              <IconShield size={14} className="mt-0.5 text-[#D4A373] shrink-0" />
              <p className="text-[11.5px] sm:text-[13px] leading-snug sm:leading-relaxed">
                Achetez sur les réseaux <span className="font-semibold">sans risque d&apos;arnaque</span>.
                L&apos;argent est protégé jusqu&apos;à la livraison.
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#E8E2D5]/60 px-4 sm:px-6 py-2.5 sm:py-3.5 flex justify-end z-10">
          <button
            type="button"
            onClick={onClose}
            className="lp-btn lp-btn-primary !py-1.5 sm:!py-2 !px-4 sm:!px-5 !text-[12px] sm:!text-[13px]"
          >
            J&apos;ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
