import { BrandMark } from "@/components/ui/BrandMark";
import { Reveal } from "@/components/marketing/Reveal";
import { StoreBadges } from "@/components/marketing/StoreBadges";
import { LandingPhoto } from "@/components/marketing/LandingPhoto";

export function LandingFinalCTA() {
  return (
    <section
      id="telecharger"
      className="bg-white text-[#1E3A5F] py-20 md:py-24 relative overflow-hidden border-t border-[#1E3A5F]/8"
    >
      <div className="lp-container relative grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <Reveal className="text-center lg:text-left">
          <div className="mb-10 flex justify-center lg:justify-start">
            <BrandMark size="lg" href={null} />
          </div>
          <h2
            style={{
              fontSize: "clamp(2.2rem, 5vw, 4rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              fontWeight: 600,
              color: "#1E3A5F",
            }}
          >
            Vendez avant de livrer.
            <br />
            <span className="italic text-[#B8895A]">Achetez sans risquer.</span>
          </h2>
          <p className="mt-6 text-[17px] text-[#1E3A5F]/70 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            XaalisPay transforme chaque transaction en échange sécurisé entre vendeur et acheteur. Inscription et
            boutique gratuites.
          </p>

          <StoreBadges className="mt-10 lg:!justify-start" />
        </Reveal>

        <Reveal className="mx-auto w-full max-w-[460px]">
          <LandingPhoto
            src="/landing/final-unboxing.webp"
            alt="Cliente qui ouvre son colis chez elle, rassurée"
            sizes="(min-width: 1024px) 460px, 90vw"
            className="aspect-[4/5] rounded-[32px]"
          />
        </Reveal>
      </div>
    </section>
  );
}
