"use client";

import Link from "next/link";
import { IconArrowRight } from "@/components/icons";
import { Reveal } from "@/components/marketing/Reveal";

export function LandingHero() {
  return (
    <section id="top" className="relative bg-white overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#1E3A5F 1px, transparent 1px), linear-gradient(90deg, #1E3A5F 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black 40%, transparent 75%)",
        }}
      />
      <div className="lp-container relative pt-10 pb-10 md:pt-14 md:pb-14">
        <h1
          className="text-center mx-auto max-w-5xl"
          style={{ fontSize: "clamp(2.4rem, 6.5vw, 5.5rem)", lineHeight: 1, letterSpacing: "-0.035em" }}
        >
          <span className="block text-[#1E3A5F] font-bold lp-text-3d">Vendez avant de livrer.</span>
          <span className="italic font-normal text-[#D4A373]">Achetez sans risquer.</span>
        </h1>

        <p className="mt-6 mx-auto max-w-2xl text-center text-[16px] md:text-[18px] leading-[1.5] text-[#6B7280]">
          <span className="text-[#1E3A5F] font-medium">Le vendeur est payé</span> sans craindre les commandes
          fantômes. <span className="text-[#1E3A5F] font-medium">L&apos;acheteur paie l&apos;esprit tranquille</span>,
          remboursé si quelque chose ne va pas. <br/> Fini les arnaques, fini le stress.
        </p>

        <Reveal className="mt-8 flex flex-row items-center justify-center gap-2 sm:gap-3">
          <a
            href="#telecharger"
            className="lp-btn lp-btn-primary !py-2.5 sm:!py-3 !px-4 sm:!px-6 !text-[13px] sm:!text-[14px] shrink-0"
          >
            Télécharger l&apos;app <IconArrowRight size={14} />
          </a>
          <Link
            href="/auth"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#1E3A5F]/15 bg-white text-[#1E3A5F]/80 font-medium text-[13px] sm:text-[14px] py-2.5 sm:py-3 px-4 sm:px-6 hover:border-[#1E3A5F]/30 hover:text-[#1E3A5F] transition-colors shrink-0"
          >
            Se connecter
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
