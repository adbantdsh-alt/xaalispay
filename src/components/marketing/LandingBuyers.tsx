import { ShieldCheck, KeyRound, Clock3 } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const CARDS = [
  {
    Icon: ShieldCheck,
    title: "Argent protégé",
    desc: "Votre paiement reste en séquestre. Le vendeur n'y a pas accès tant que vous n'avez pas reçu votre commande.",
  },
  {
    Icon: KeyRound,
    title: "Preuve à la livraison",
    desc: "Un code PIN unique remis au livreur prouve la réception. Pas de PIN, pas de paiement libéré.",
  },
  {
    Icon: Clock3,
    title: "Litige 30 minutes",
    desc: "Un problème ? Vous avez 30 minutes après réception pour ouvrir un litige. Notre équipe tranche.",
  },
];

export function LandingBuyers() {
  return (
    <section className="lp-section lp-buyers" id="acheteurs">
      <div className="lp-container">
        <Reveal className="lp-section-head">
          <p className="lp-kicker">Pour les acheteurs</p>
          <h2 className="lp-h2 serif">Acheter en ligne, sans jamais douter.</h2>
        </Reveal>

        <div className="lp-cards">
          {CARDS.map((card, i) => (
            <Reveal key={card.title} className="lp-card" delay={i * 0.08}>
              <span className="lp-card-icon">
                <card.Icon size={30} strokeWidth={1.25} />
              </span>
              <h3 className="lp-card-title serif">{card.title}</h3>
              <p className="lp-card-desc">{card.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
