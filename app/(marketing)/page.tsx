import Link from "next/link";
import { VendorSearch } from "@/components/marketing/VendorSearch";
import { LandingEscrowBlock } from "@/components/marketing/LandingEscrowBlock";
import { LandingBuyerCards } from "@/components/marketing/LandingBuyerCards";
import { LandingSellerBand } from "@/components/marketing/LandingSellerBand";
import { IconArrowRight, IconKey, IconPackage, IconWave } from "@/components/ui/AppIcon";

const STEPS = [
  { num: "01", title: "Vous payez", desc: "Wave ou Orange Money", Icon: IconWave },
  { num: "02", title: "Vous vérifiez", desc: "Colis ouvert, PIN gardé", Icon: IconPackage },
  { num: "03", title: "30 min", desc: "Litige ou vendeur payé", Icon: IconKey },
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <section className="landing-hero">
        <h1 className="landing-title">Achetez en live sans risque</h1>
        <p className="landing-lead">
          Séquestre jusqu&apos;à réception · Wave · Orange Money
        </p>

        <div className="landing-search-block">
          <VendorSearch large />
          <p className="landing-search-hint">
            Tapez le @ du vendeur vu sur TikTok, Instagram ou WhatsApp
          </p>
        </div>

        <p className="landing-micro">Sans compte · Sans appli · Paiement en 1 clic</p>

        <Link href="/auth?mode=signup" className="landing-seller-link">
          Vous vendez ? Créer ma boutique
          <IconArrowRight size={15} />
        </Link>
      </section>

      <LandingEscrowBlock />

      <LandingBuyerCards />

      <section className="landing-steps">
        <div className="landing-section-head">
          <p className="landing-kicker">Comment ça marche</p>
          <h2 className="landing-section-title">3 étapes, c&apos;est tout</h2>
        </div>
        <div className="landing-steps-row">
          {STEPS.map((step, i) => (
            <article key={step.num} className="landing-step">
              {i < STEPS.length - 1 && <span className="landing-step-line" aria-hidden="true" />}
              <div className="landing-step-icon">
                <step.Icon size={20} />
              </div>
              <span className="landing-step-num">{step.num}</span>
              <h3 className="landing-step-title">{step.title}</h3>
              <p className="landing-step-desc">{step.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <LandingSellerBand />
    </div>
  );
}
