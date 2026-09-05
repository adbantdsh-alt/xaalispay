import { BrandMark } from "@/components/ui/BrandMark";
import { Reveal } from "@/components/marketing/Reveal";
import { StoreBadges } from "@/components/marketing/StoreBadges";

export function LandingFinalCTA() {
  return (
    <section
      id="telecharger"
      className="bg-white text-[#1E3A5F] py-20 md:py-24 relative overflow-hidden border-t border-[#1E3A5F]/8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#1E3A5F 1px, transparent 1px), linear-gradient(90deg, #1E3A5F 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black 30%, transparent 70%)",
        }}
      />
      <div className="lp-container relative">
        <Reveal className="max-w-3xl mx-auto text-center">
          <div className="mb-10 flex justify-center">
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
          <p className="mt-6 text-[17px] text-[#1E3A5F]/70 max-w-xl mx-auto leading-relaxed">
            XaalisPay transforme chaque transaction en échange sécurisé entre vendeur et acheteur.
          </p>

          <StoreBadges className="mt-10" />
        </Reveal>
      </div>
    </section>
  );
}
