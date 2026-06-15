import Link from "next/link";
import { MapPin } from "lucide-react";

const COLS = [
  {
    title: "Produit",
    links: [
      { label: "Comment ça marche", href: "/#comment" },
      { label: "Tarifs", href: "/#faq" },
      { label: "Notre histoire", href: "/histoire" },
      { label: "Nous contacter", href: "/contact" },
    ],
  },
  {
    title: "Acheteurs",
    links: [
      { label: "Acheter en sécurité", href: "/#acheteurs" },
      { label: "Le séquestre", href: "/#comment" },
      { label: "Ouvrir un litige", href: "/contact" },
    ],
  },
  {
    title: "Vendeurs",
    links: [
      { label: "Créer un compte", href: "/auth?mode=signup" },
      { label: "Se connecter", href: "/auth" },
      { label: "XaalisTag", href: "/#vendeurs" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Conditions générales", href: "/cgv" },
      { label: "Confidentialité", href: "/confidentialite" },
      { label: "Mentions légales", href: "/mentions-legales" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-brand">
          <p className="lp-footer-brand-name serif">
            Xaalis<b>Pay</b>
          </p>
          <p className="lp-footer-tag">
            Le tiers de confiance qui sécurise vos paiements au Sénégal. Payez les yeux
            fermés, ouvrez-les à la réception.
          </p>
          <span className="lp-footer-loc">
            <MapPin size={15} strokeWidth={1.5} />
            Dakar, Sénégal 🇸🇳
          </span>
        </div>

        {COLS.map((col) => (
          <div key={col.title} className="lp-footer-col">
            <p className="lp-footer-col-title">{col.title}</p>
            {col.links.map((link) => (
              <Link key={link.label} href={link.href} className="lp-footer-link">
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="lp-footer-partners">
        <span className="lp-footer-partner">Wave</span>
        <span className="lp-footer-partner">Orange Money</span>
        <span className="lp-footer-partner">Free Money</span>
        <span className="lp-footer-partner">Conforme BCEAO</span>
      </div>

      <div className="lp-footer-bottom">
        <p>© {year} XaalisPay</p>
        <div className="lp-footer-bottom-links">
          <Link href="/cgv">Conditions</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/mentions-legales">Mentions légales</Link>
        </div>
      </div>
    </footer>
  );
}
