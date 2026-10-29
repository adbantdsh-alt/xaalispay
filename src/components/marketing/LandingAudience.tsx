"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { IconArrowRight, IconCheck } from "@/components/icons";
import { Reveal } from "@/components/marketing/Reveal";
import { LandingPhoto } from "@/components/marketing/LandingPhoto";
import { ActionRequiredScreen, CheckoutScreen, PhoneFrame } from "@/components/marketing/AppMockups";

const SELLER_POINTS = [
  "Un lien de paiement par produit, à coller sur Instagram, WhatsApp ou TikTok",
  "Votre XaalisTag : toute votre boutique sur xaalispay.com/votre-nom",
  "L'argent est bloqué avant que vous ne bougiez : plus de commandes fantômes",
  "Retrait 100 % gratuit vers Wave ou Orange Money",
];
const BUYER_POINTS = [
  "Vous payez avec Wave, Orange Money, MTN ou Moov, comme d'habitude",
  "Le vendeur n'est payé que quand vous avez le colis entre les mains",
  "Pas livré sous 72 h ? Remboursé automatiquement, frais inclus",
  "30 minutes pour vérifier et ouvrir un litige si ça ne va pas",
];

export function LandingAudience() {
  return (
    <section id="pour-qui" className="bg-white py-20 md:py-28 scroll-mt-20">
      <div className="lp-container">
        <Reveal className="max-w-3xl mx-auto text-center">
          <span className="lp-pill">Pour qui ?</span>
          <h2 className="lp-h2 mt-5">Pensé pour ceux qui vendent et achètent sur les réseaux.</h2>
          <p className="mt-5 text-[17px] leading-relaxed text-[#6B7280]">
            Boutiques Instagram, vendeurs WhatsApp, créateurs TikTok, et tous leurs clients. XaalisPay se place au
            milieu pour que personne n&apos;ait à faire confiance à l&apos;aveugle.
          </p>
        </Reveal>

        <div className="mt-16 md:mt-20 space-y-20 md:space-y-28">
          <AudienceRow
            eyebrow="Vous vendez"
            title="Encaissez avant de livrer, livrez sans stress."
            points={SELLER_POINTS}
            cta={{ href: "/auth?mode=signup", label: "Créer ma boutique" }}
            photo="/landing/persona-seller.webp"
            alt="Créateur de mode qui photographie un produit pour sa boutique Instagram"
            phone={<ActionRequiredScreen />}
          />
          <AudienceRow
            reverse
            eyebrow="Vous achetez"
            title="Payez en ligne, gardez la main sur votre argent."
            points={BUYER_POINTS}
            cta={{ href: "/#comment", label: "Voir comment ça marche" }}
            photo="/landing/persona-buyer.webp"
            alt="Étudiante qui paie un article sur son téléphone dans un café"
            phone={<CheckoutScreen />}
            phoneBackground="var(--bg-mesh)"
            phoneScrollY={770}
            phoneBrowserUrl="xaalispay.com"
          />
        </div>
      </div>
    </section>
  );
}

function AudienceRow({
  eyebrow,
  title,
  points,
  cta,
  photo,
  alt,
  phone,
  phoneBackground,
  phoneScrollY,
  phoneBrowserUrl,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  points: string[];
  cta: { href: string; label: string };
  photo: string;
  alt: string;
  phone: ReactNode;
  phoneBackground?: string;
  phoneScrollY?: number;
  phoneBrowserUrl?: string;
  reverse?: boolean;
}) {
  return (
    <Reveal className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
      <div className={`relative mx-auto w-full max-w-[520px] mt-16 sm:mt-0 ${reverse ? "lg:order-2" : ""}`}>
        <LandingPhoto
          src={photo}
          alt={alt}
          sizes="(min-width: 1024px) 460px, 85vw"
          className={`aspect-[4/5] w-[85%] rounded-[28px] ${reverse ? "ml-auto" : ""}`}
        />
        <div
          className={`absolute bottom-[-24px] scale-[0.8] sm:scale-100 ${
            reverse ? "left-0 origin-bottom-left" : "right-0 origin-bottom-right"
          }`}
        >
          <PhoneFrame width={210} background={phoneBackground} scrollY={phoneScrollY} browserUrl={phoneBrowserUrl}>
            {phone}
          </PhoneFrame>
        </div>
      </div>

      <div className={reverse ? "lg:order-1" : ""}>
        <div className="lp-eyebrow">{eyebrow}</div>
        <h3 className="mt-4 text-[30px] md:text-[40px] font-semibold text-[#1E3A5F] leading-[1.1] tracking-tight">
          {title}
        </h3>
        <ul className="mt-8 space-y-4">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-[16px] leading-relaxed text-[#1E3A5F]">
              <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#1E3A5F] text-[#D4A373]">
                <IconCheck size={11} />
              </span>
              {p}
            </li>
          ))}
        </ul>
        <Link href={cta.href} className="lp-btn lp-btn-primary mt-9 inline-flex">
          {cta.label} <IconArrowRight size={16} />
        </Link>
      </div>
    </Reveal>
  );
}
