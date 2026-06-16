import type { Metadata } from "next";
import { HomeJsonLd } from "@/components/seo/HomeJsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { LandingHero } from "@/components/marketing/LandingHero";
import { LandingStats } from "@/components/marketing/LandingStats";
import { LandingHowItWorks } from "@/components/marketing/LandingHowItWorks";
import { LandingBuyers } from "@/components/marketing/LandingBuyers";
import { LandingSellers } from "@/components/marketing/LandingSellers";
import { LandingTestimonials } from "@/components/marketing/LandingTestimonials";
import { LandingPricing } from "@/components/marketing/LandingPricing";
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
      <LandingStats />
      <LandingHowItWorks />
      <LandingBuyers />
      <LandingSellers />
      <LandingTestimonials />
      <LandingPricing />
      <LandingFAQ />
      <LandingFinalCTA />
    </>
  );
}
