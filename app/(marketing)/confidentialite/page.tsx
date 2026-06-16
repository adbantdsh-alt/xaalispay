import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité XaalisPay : collecte, utilisation et protection de vos données personnelles au Sénégal.",
  path: "/confidentialite",
});

export default function ConfidentialitePage() {
  return (
    <article className="content-page legal-page">
      <header className="content-hero">
        <p className="section-label">Légal</p>
        <h1 className="content-title">Politique de confidentialité</h1>
        <p className="content-lead">Dernière mise à jour : juin 2026</p>
      </header>

      <div className="glass-card legal-body">
        <section>
          <h2>1. Données collectées</h2>
          <p>
            XaalisPay collecte les données nécessaires au traitement des paiements et commandes :
            nom, numéro de téléphone (acheteurs), email et identifiants vendeur (comptes
            professionnels), ainsi que les métadonnées de transaction.
          </p>
        </section>

        <section>
          <h2>2. Finalités</h2>
          <ul>
            <li>Exécution du service de séquestre et de paiement.</li>
            <li>Gestion des litiges et du support client.</li>
            <li>Prévention de la fraude et sécurisation des comptes vendeurs.</li>
          </ul>
        </section>

        <section>
          <h2>3. Conservation</h2>
          <p>
            Les données de transaction sont conservées pendant la durée légale requise pour la
            comptabilité et la résolution des litiges.
          </p>
        </section>

        <section>
          <h2>4. Partage</h2>
          <p>
            Vos données ne sont pas vendues. Elles peuvent être partagées avec les prestataires
            de paiement (Wave, Orange Money) uniquement pour l&apos;exécution du paiement.
          </p>
        </section>

        <section>
          <h2>5. Vos droits</h2>
          <p>
            Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données en
            contactant{" "}
            <a href="mailto:contact@xaalispay.sn" className="content-link">
              contact@xaalispay.sn
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
