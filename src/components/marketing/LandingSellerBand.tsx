import Link from "next/link";
import { IconArrowRight, IconShield, IconWallet } from "@/components/ui/AppIcon";

const POINTS = [
  { Icon: IconWallet, title: "Payé dès la livraison", desc: "Libération après validation du PIN" },
  { Icon: IconShield, title: "Anti mauvaise foi", desc: "30 min de Séquestre Flash pour litige" },
  { Icon: IconArrowRight, title: "Lien en 2 secondes", desc: "TikTok, Instagram, WhatsApp" },
] as const;

export function LandingSellerBand() {
  return (
    <section id="vendeurs" className="landing-seller" aria-labelledby="landing-seller-title">
      <div className="landing-section-head">
        <p className="landing-kicker">Pour les vendeurs</p>
        <h2 id="landing-seller-title" className="landing-section-title">
          Vendez en live, encaissez sereinement
        </h2>
      </div>

      <div className="landing-seller-grid">
        {POINTS.map(({ Icon, title, desc }) => (
          <article key={title} className="landing-seller-item">
            <span className="landing-seller-item-icon" aria-hidden="true">
              <Icon size={20} />
            </span>
            <h3 className="landing-seller-item-title">{title}</h3>
            <p className="landing-seller-item-desc">{desc}</p>
          </article>
        ))}
      </div>

      <div className="landing-seller-cta-wrap">
        <Link href="/auth?mode=signup" className="landing-seller-cta">
          Créer ma boutique
          <IconArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}
