import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { HomeJsonLd } from "@/components/seo/HomeJsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { LandingHero } from "@/components/marketing/LandingHero";
import { LandingXaalisTagSearch } from "@/components/marketing/LandingXaalisTagSearch";

const LandingHowItWorks = dynamic(() =>
  import("@/components/marketing/LandingHowItWorks").then((m) => ({
    default: m.LandingHowItWorks,
  }))
);

const LandingFAQ = dynamic(() =>
  import("@/components/marketing/LandingFAQ").then((m) => ({
    default: m.LandingFAQ,
  }))
);

const LandingFinalCTA = dynamic(() =>
  import("@/components/marketing/LandingFinalCTA").then((m) => ({
    default: m.LandingFinalCTA,
  }))
);

export const metadata: Metadata = buildPageMetadata({
  title: "Paiement sécurisé au Sénégal — Payez les yeux fermés",
  description:
    "XaalisPay sécurise vos achats en ligne au Sénégal avec séquestre, Wave, Orange Money et protection anti-arnaque. Zéro arnaque sur Instagram et WhatsApp.",
  path: "/",
});

export default function LandingPage() {
  return (
    <>
      <HomeJsonLd />
      <LandingHero />
      <LandingXaalisTagSearch />
      <LandingHowItWorks />
      <LandingFAQ />
      <LandingFinalCTA />
    </>
  );
}
