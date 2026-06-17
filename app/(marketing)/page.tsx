import type { Metadata } from "next";
import { HomeJsonLd } from "@/components/seo/HomeJsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { LandingHero } from "@/components/marketing/LandingHero";
import { LandingXaalisTagSearch } from "@/components/marketing/LandingXaalisTagSearch";
import { LandingHowItWorks } from "@/components/marketing/LandingHowItWorks";
import { LandingFAQ } from "@/components/marketing/LandingFAQ";
import { LandingFinalCTA } from "@/components/marketing/LandingFinalCTA";

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
