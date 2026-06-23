import { BrandMark } from "@/components/ui/BrandMark";
import { Reveal } from "@/components/marketing/Reveal";

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

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-3 bg-[#1E3A5F] lp-text-white rounded-xl px-5 py-3 hover:bg-[#15294a] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                <path d="M17.05 12.04c-.03-2.83 2.31-4.19 2.41-4.25-1.31-1.92-3.36-2.19-4.09-2.22-1.74-.18-3.4 1.03-4.28 1.03-.9 0-2.25-1-3.7-.97-1.9.03-3.66 1.11-4.64 2.81-1.98 3.43-.51 8.51 1.42 11.3.94 1.36 2.06 2.88 3.53 2.83 1.42-.06 1.96-.92 3.68-.92 1.7 0 2.2.92 3.7.89 1.52-.03 2.49-1.39 3.42-2.75 1.08-1.58 1.52-3.12 1.54-3.2-.03-.01-2.96-1.13-2.99-4.55Zm-2.84-8.34c.78-.95 1.31-2.27 1.17-3.58-1.13.05-2.49.75-3.3 1.69-.72.83-1.36 2.17-1.19 3.46 1.26.1 2.54-.64 3.32-1.57Z" />
              </svg>
              <div className="text-left leading-tight">
                <div className="text-[10px] opacity-70">Télécharger sur</div>
                <div className="text-[15px] font-semibold">App Store</div>
              </div>
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-3 bg-[#1E3A5F] lp-text-white rounded-xl px-5 py-3 hover:bg-[#15294a] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                <path d="M3.6 1.6c-.4.4-.6 1-.6 1.7v17.4c0 .7.2 1.3.6 1.7l9.7-9.7L3.6 1.6Zm10.8 10.8 2.6 2.6 3.5-2c.9-.5 1.5-1 1.5-1.7s-.6-1.2-1.5-1.7l-3.5-2-2.6 2.6 0 2.2Zm-1.1 1.1L4 22.8c.3.1.7.2 1 .2.4 0 .8-.1 1.2-.3l11-6.3-3.9-3.9Zm0-3.4L16.2 7l-11-6.3C4.8.5 4.4.4 4 .4c-.3 0-.7.1-1 .2l9.3 9.5Z" />
              </svg>
              <div className="text-left leading-tight">
                <div className="text-[10px] opacity-70">Disponible sur</div>
                <div className="text-[15px] font-semibold">Google Play</div>
              </div>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
