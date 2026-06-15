import { Reveal } from "@/components/marketing/Reveal";

const TESTIMONIALS = [
  {
    initials: "AM",
    quote:
      "Avant, mes clientes avaient peur de payer avant la livraison. Avec le séquestre, elles commandent sans hésiter — mes ventes ont doublé.",
    name: "Awa Mbaye",
    role: "Boutique mode · TikTok",
  },
  {
    initials: "CS",
    quote:
      "J'ai été arnaqué deux fois sur Instagram. Aujourd'hui je ne paie plus que via XaalisPay. L'argent reste bloqué jusqu'à ce que je reçoive.",
    name: "Cheikh Sow",
    role: "Acheteur · Dakar",
  },
  {
    initials: "ND",
    quote:
      "Le code PIN à la livraison a tout changé. Plus de litiges interminables, je suis payé dès que le client valide. Du sérieux.",
    name: "Ndèye Diallo",
    role: "Cosmétiques · WhatsApp",
  },
];

export function LandingTestimonials() {
  return (
    <section className="lp-section lp-testimonials">
      <div className="lp-container">
        <Reveal className="lp-section-head">
          <p className="lp-kicker">Ils nous font confiance</p>
          <h2 className="lp-h2 serif">La confiance, racontée par ceux qui l&apos;utilisent.</h2>
        </Reveal>

        <div className="lp-cards">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} className="lp-quote" delay={i * 0.08}>
              <p className="lp-quote-text">“{t.quote}”</p>
              <div className="lp-quote-foot">
                <span className="lp-quote-avatar">{t.initials}</span>
                <span>
                  <span className="lp-quote-name">{t.name}</span>
                  <br />
                  <span className="lp-quote-role">{t.role}</span>
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
