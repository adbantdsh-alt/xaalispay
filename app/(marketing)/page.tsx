import Link from "next/link";
import { VendorSearch } from "@/components/marketing/VendorSearch";
import { BrandMark } from "@/components/ui/BrandMark";

const STEPS = [
  { num: "01", title: "Vous payez", desc: "Wave ou Orange Money — fonds bloqués chez XaalisPay." },
  { num: "02", title: "Vous recevez", desc: "Vérifiez le colis avant de donner votre code PIN." },
  { num: "03", title: "30 min pour réagir", desc: "Problème ? Signalez-le pendant le Séquestre Flash." },
  { num: "04", title: "C'est réglé", desc: "Vendeur payé ou remboursement automatique." },
];

const TRUST = [
  ["🛡️", "Séquestre", "Argent protégé"],
  ["🌊", "Wave", "Paiement familier"],
  ["📱", "Zéro compte", "Achetez vite"],
  ["🇸🇳", "Sénégal", "Fait pour vous"],
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <section className="landing-hero animate-fade-in">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <BrandMark size="lg" />
        </div>
        <p className="landing-eyebrow">Paiement sécurisé · Sénégal</p>
        <h1 className="landing-title">
          Achetez sans crainte
          <br />
          <span className="landing-title-accent">sur les réseaux</span>
        </h1>
        <p className="landing-lead">
          Votre argent en séquestre jusqu&apos;à réception. Fini les arnaques Instagram et WhatsApp.
        </p>

        <div className="landing-search-block">
          <VendorSearch large />
        </div>

        <div className="landing-hero-cta">
          <Link href="/auth?mode=signup" className="btn-primary" style={{ width: "auto", padding: "0 2rem" }}>
            Ouvrir ma boutique
          </Link>
          <Link href="/histoire" className="btn-secondary" style={{ width: "auto", padding: "0 2rem" }}>
            Notre histoire
          </Link>
        </div>
      </section>

      <section className="landing-trust animate-fade-in-delay">
        <div className="landing-trust-grid">
          {TRUST.map(([icon, title, desc]) => (
            <div key={title} className="landing-trust-item">
              <p style={{ fontSize: "1.5rem" }}>{icon}</p>
              <p className="landing-trust-title">{title}</p>
              <p className="landing-trust-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <p className="section-label">Comment ça marche</p>
        <h2 className="landing-section-title">Simple comme Wave</h2>
        <div className="landing-steps">
          {STEPS.map((step) => (
            <article key={step.num} className="glass-card landing-step-card">
              <span className="landing-step-num">{step.num}</span>
              <h3 className="landing-step-title">{step.title}</h3>
              <p className="landing-step-desc">{step.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-seller-cta">
          <div>
            <p className="section-label">Vendeurs</p>
            <h2 className="landing-section-title">Vendez avec confiance</h2>
            <p className="landing-story-text">
              Proposez le paiement sécurisé à vos clients TikTok, Instagram et WhatsApp.
            </p>
          </div>
          <Link href="/auth?mode=signup" className="btn-primary" style={{ width: "auto", flexShrink: 0, padding: "0 2rem" }}>
            Créer ma boutique
          </Link>
        </div>
      </section>
    </div>
  );
}
