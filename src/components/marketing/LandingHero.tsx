"use client";

import Link from "next/link";
import { IconArrowRight, IconCheck, IconShield } from "@/components/icons";
import { Reveal } from "@/components/marketing/Reveal";
import { StoreBadges } from "@/components/marketing/StoreBadges";
import { LandingPhoto } from "@/components/marketing/LandingPhoto";
import { DashboardScreen, FloatingCard, PhoneFrame } from "@/components/marketing/AppMockups";

const PROOFS = ["Payé avant de livrer", "Livré sous 48 h ou remboursé", "30 min pour vérifier", "Retrait 100 % gratuit"];

export function LandingHero() {
  return (
    <section id="top" className="relative bg-white overflow-hidden">
      <div className="lp-container relative pt-8 pb-14 md:pt-14 md:pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 text-left">
          <h1
            style={{ fontSize: "clamp(2.4rem, 5.4vw, 4.6rem)", lineHeight: 1, letterSpacing: "-0.035em" }}
          >
            <span className="block text-[#1E3A5F] font-bold lp-text-3d">Vendez avant de livrer.</span>
            <span className="italic font-normal text-[#D4A373]">Achetez sans risquer.</span>
          </h1>

          <p className="mt-6 max-w-xl text-[16px] md:text-[18px] leading-[1.55] text-[#6B7280]">
            <span className="text-[#1E3A5F] font-medium">Le vendeur est payé</span> sans craindre les commandes
            fantômes. <span className="text-[#1E3A5F] font-medium">L&apos;acheteur paie l&apos;esprit tranquille</span>,
            remboursé si quelque chose ne va pas. Fini les arnaques, fini le stress.
          </p>

          <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
            {PROOFS.map((p) => (
              <li key={p} className="flex items-start gap-1.5 text-[13.5px] sm:text-[14px] leading-snug text-[#1E3A5F]">
                <span className="mt-[2px] grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#F7EEE3] text-[#B8895D]">
                  <IconCheck size={10} />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <Reveal className="mt-9 flex flex-col items-start gap-4">
            <StoreBadges compact className="!justify-start" />
            <Link
              href="/auth?mode=signup"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-[#1E3A5F] underline-offset-4 hover:underline"
            >
              Ou créez votre boutique gratuitement sur le web <IconArrowRight size={14} />
            </Link>
          </Reveal>
        </div>

        {/* Visuel : vendeuse + vrai écran Accueil de l'app + cartes flottantes */}
        <div className="lg:col-span-6 relative mx-auto w-full max-w-[540px] mt-6 sm:mt-0">
          <LandingPhoto
            src="/landing/hero-seller.webp"
            alt="Vendeuse dakaroise qui consulte ses ventes XaalisPay sur son téléphone"
            sizes="(min-width: 1024px) 540px, 92vw"
            priority
            objectPosition="30% center"
            className="ml-auto aspect-[4/5] w-[82%] rounded-[32px]"
          />
          <div className="absolute left-0 bottom-[-28px] origin-bottom-left scale-[0.72] sm:scale-100">
            <PhoneFrame width={230}>
              <DashboardScreen />
            </PhoneFrame>
          </div>
          <FloatingCard
            className="absolute right-[-8px] top-[10%] lp-animate-float"
            icon={<IconShield size={16} />}
            title="Paiement reçu · Wave"
            value="+17 000 F en séquestre"
          />
          <FloatingCard
            className="absolute right-[4%] bottom-[16%] hidden sm:flex lp-animate-float [animation-delay:1.2s]"
            tone="navy"
            icon={<IconCheck size={16} />}
            title="Code livreur validé"
            value="Libération dans 30 min"
          />
        </div>
      </div>
    </section>
  );
}
