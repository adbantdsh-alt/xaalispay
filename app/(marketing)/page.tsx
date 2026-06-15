import { LandingHero } from "@/components/marketing/LandingHero";
import { LandingStats } from "@/components/marketing/LandingStats";
import { LandingHowItWorks } from "@/components/marketing/LandingHowItWorks";
import { LandingBuyers } from "@/components/marketing/LandingBuyers";
import { LandingSellers } from "@/components/marketing/LandingSellers";
import { LandingTestimonials } from "@/components/marketing/LandingTestimonials";
import { LandingFAQ } from "@/components/marketing/LandingFAQ";
import { LandingFinalCTA } from "@/components/marketing/LandingFinalCTA";

export default function LandingPage() {
  return (
    <>
      <LandingHero />
      <LandingStats />
      <LandingHowItWorks />
      <LandingBuyers />
      <LandingSellers />
      <LandingTestimonials />
      <LandingFAQ />
      <LandingFinalCTA />
    </>
  );
}
