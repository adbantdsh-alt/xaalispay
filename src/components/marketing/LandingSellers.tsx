import Link from "next/link";
import { Banknote, Link2, ShieldAlert, ArrowRight, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const BULLETS = [
  {
    Icon: Banknote,
    title: "Payé dès validation",
    desc: "L'argent est disponible dès que l'acheteur confirme la réception. Plus d'attente, plus d'impayés.",
  },
  {
    Icon: Link2,
    title: "Lien de paiement en 2 secondes",
    desc: "Partagez votre XaalisTag sur TikTok, Instagram ou WhatsApp. Vos clients paient en un clic.",
  },
  {
    Icon: ShieldAlert,
    title: "Anti mauvaise foi",
    desc: "Séquestre Flash 30 min, preuve par code PIN, historique horodaté. Vous êtes couvert.",
  },
];

const DASH_ROWS = [
  { initials: "MD", name: "Moussa Diop", status: "Livré · validé", amount: "+ 18 000" },
  { initials: "FS", name: "Fatou Sarr", status: "Séquestre actif", amount: "12 500" },
  { initials: "AB", name: "Aïda Ba", status: "Livré · validé", amount: "+ 7 900" },
];

export function LandingSellers() {
  return (
    <section className="lp-section lp-sellers" id="vendeurs">
      <div className="lp-container lp-sellers-grid">
        <Reveal className="lp-dash" y={24}>
          <div className="lp-dash-top">
            <span className="lp-dash-brand">
              <ShieldCheck size={16} strokeWidth={1.6} />
              Tableau de bord
            </span>
            <span className="lp-dash-pill">Aujourd&apos;hui</span>
          </div>
          <p className="lp-dash-balance-label">Solde disponible</p>
          <p className="lp-dash-balance serif">186 400 F</p>
          <div className="lp-dash-bars" aria-hidden="true">
            {[42, 60, 38, 72, 50, 88, 64].map((h, i) => (
              <span
                key={i}
                className={`lp-dash-bar ${i === 5 ? "is-active" : ""}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="lp-dash-rows">
            {DASH_ROWS.map((row) => (
              <div key={row.name} className="lp-dash-row">
                <span className="lp-dash-row-left">
                  <span className="lp-dash-row-avatar">{row.initials}</span>
                  <span>
                    <span className="lp-dash-row-name">{row.name}</span>
                    <br />
                    <span className="lp-dash-row-status">{row.status}</span>
                  </span>
                </span>
                <span className="lp-dash-row-amount">{row.amount}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="lp-sellers-copy">
          <Reveal className="lp-section-head">
            <p className="lp-kicker">Pour les vendeurs</p>
            <h2 className="lp-h2 serif lp-h2-light">Vendez sereinement. Encaissez sans friction.</h2>
          </Reveal>

          <div className="lp-bullets">
            {BULLETS.map((b, i) => (
              <Reveal key={b.title} className="lp-bullet" delay={i * 0.08}>
                <span className="lp-bullet-icon">
                  <b.Icon size={24} strokeWidth={1.25} />
                </span>
                <span>
                  <h3 className="lp-bullet-title">{b.title}</h3>
                  <p className="lp-bullet-desc">{b.desc}</p>
                </span>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <Link href="/auth?mode=signup" className="lp-btn lp-btn-teal-outline">
              Créer un compte gratuitement
              <ArrowRight size={18} strokeWidth={1.75} />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
