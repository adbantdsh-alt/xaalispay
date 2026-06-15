import { IconKey, IconShield, IconSmartphone } from "@/components/ui/AppIcon";

const CARDS = [
  {
    Icon: IconShield,
    title: "Argent protégé",
    desc: "Séquestré chez XaalisPay, pas chez le vendeur.",
  },
  {
    Icon: IconKey,
    title: "Preuve instantanée",
    desc: "Code PIN unique dès le paiement — au livreur seulement.",
  },
  {
    Icon: IconSmartphone,
    title: "Zéro friction",
    desc: "Pas de compte, pas d'appli — Wave ou Orange Money.",
  },
] as const;

export function LandingBuyerCards() {
  return (
    <section id="acheteurs" className="landing-buyers" aria-labelledby="landing-buyer-title">
      <div className="landing-section-head">
        <p className="landing-kicker">Pour les acheteurs</p>
        <h2 id="landing-buyer-title" className="landing-section-title">
          3 garanties, zéro stress
        </h2>
      </div>
      <div className="landing-buyer-grid">
        {CARDS.map(({ Icon, title, desc }) => (
          <article key={title} className="landing-buyer-card">
            <span className="landing-buyer-card-icon" aria-hidden="true">
              <Icon size={22} />
            </span>
            <h3 className="landing-buyer-card-title">{title}</h3>
            <p className="landing-buyer-card-desc">{desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
