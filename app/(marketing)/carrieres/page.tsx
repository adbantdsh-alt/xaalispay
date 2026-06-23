export default function CarrieresPage() {
  return (
    <article className="content-page">
      <header className="content-hero">
        <p className="section-label">Carrières</p>
        <h1 className="content-title">Construisez le paiement de demain au Sénégal</h1>
        <p className="content-lead">
          Chez XaalisPay, nous bâtissons une infrastructure de confiance pour des milliers de
          vendeurs et d&apos;acheteurs. Rejoignez une équipe locale et ambitieuse.
        </p>
      </header>

      <div className="lp-card-flat content-chapter">
        <h2 className="content-chapter-title text-[22px] md:text-[26px] font-medium">Nos valeurs</h2>
        <ul className="mt-4 space-y-2 list-disc pl-5 text-[15px] text-muted leading-relaxed">
          <li>
            <strong className="text-black">Confiance d&apos;abord.</strong> Chaque décision protège
            nos utilisateurs.
          </li>
          <li>
            <strong className="text-black">Local, profond.</strong> Nous construisons depuis le
            Sénégal, pour l&apos;Afrique.
          </li>
          <li>
            <strong className="text-black">Simplicité radicale.</strong> Un produit que tout le
            monde peut utiliser.
          </li>
          <li>
            <strong className="text-black">Excellence sans bruit.</strong> On livre, on
            n&apos;esbroufe pas.
          </li>
        </ul>
      </div>

      <div className="lp-card-flat content-chapter">
        <h2 className="content-chapter-title text-[22px] md:text-[26px] font-medium">Candidature spontanée</h2>
        <p className="content-chapter-body" style={{ whiteSpace: "normal" }}>
          Nous n&apos;avons pas de poste ouvert publié pour le moment, mais nous sommes toujours
          curieux de rencontrer des personnes qui partagent notre mission. Écrivez-nous à{" "}
          <a className="content-link" href="mailto:contact@xaalispay.sn?subject=Candidature%20spontan%C3%A9e">
            contact@xaalispay.sn
          </a>{" "}
          avec votre CV et quelques mots sur ce qui vous anime.
        </p>
      </div>
    </article>
  );
}
