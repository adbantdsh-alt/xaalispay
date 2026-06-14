import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <p className="site-footer-logo">XaalisPay</p>
          <p className="site-footer-desc">
            Paiement sécurisé par séquestre pour les achats en ligne au Sénégal.
            Protégez vos achats sur les réseaux sociaux.
          </p>
        </div>

        <div className="site-footer-col">
          <p className="site-footer-title">Produit</p>
          <Link href="/histoire" className="site-footer-link">
            Notre histoire
          </Link>
          <Link href="/auth?mode=signup" className="site-footer-link">
            Devenir vendeur
          </Link>
          <Link href="/contact" className="site-footer-link">
            Nous contacter
          </Link>
        </div>

        <div className="site-footer-col">
          <p className="site-footer-title">Légal</p>
          <Link href="/cgv" className="site-footer-link">
            Conditions générales
          </Link>
          <Link href="/confidentialite" className="site-footer-link">
            Confidentialité
          </Link>
          <Link href="/mentions-legales" className="site-footer-link">
            Mentions légales
          </Link>
        </div>

        <div className="site-footer-col">
          <p className="site-footer-title">Contact</p>
          <a href="mailto:contact@xaalispay.sn" className="site-footer-link">
            contact@xaalispay.sn
          </a>
          <p className="site-footer-meta">Dakar, Sénégal</p>
          <p className="site-footer-meta">Support · Lun–Ven 9h–18h</p>
        </div>
      </div>

      <div className="site-footer-bottom">
        <p>© {year} XaalisPay. Tous droits réservés.</p>
        <p>Paiement mobile · Wave · Orange Money · FCFA</p>
      </div>
    </footer>
  );
}
