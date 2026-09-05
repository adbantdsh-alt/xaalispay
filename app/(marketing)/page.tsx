import type { Metadata } from "next";
import { HomeJsonLd } from "@/components/seo/HomeJsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { LandingVendorSearchBar } from "@/components/marketing/LandingVendorSearchBar";
import { LandingHero } from "@/components/marketing/LandingHero";
import { LandingProblem } from "@/components/marketing/LandingProblem";
import { LandingHowItWorks } from "@/components/marketing/LandingHowItWorks";
import { LandingInteractiveDemo } from "@/components/marketing/LandingInteractiveDemo";
import { LandingFAQ } from "@/components/marketing/LandingFAQ";
import { LandingFinalCTA } from "@/components/marketing/LandingFinalCTA";

export const metadata: Metadata = buildPageMetadata({
  title: "Paiement sécurisé en Afrique de l'Ouest — Payez les yeux fermés",
  description:
    "XaalisPay sécurise vos achats en ligne au Sénégal, en Côte d'Ivoire, au Mali, au Bénin et au Togo avec séquestre, Wave, Orange Money et protection anti-arnaque. Zéro arnaque sur Instagram et WhatsApp.",
  path: "/",
});

export default function LandingPage() {
  return (
    <>
      <LandingVendorSearchBar />
      <HomeJsonLd />
      <LandingHero />
      <LandingProblem />
      <LandingHowItWorks />
      <LandingInteractiveDemo />
      <LandingFAQ />
      <LandingFinalCTA />
    </>
  );
}
