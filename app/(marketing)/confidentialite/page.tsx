import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité XaalisPay : collecte, utilisation et protection de vos données personnelles conformément à la loi sénégalaise n°2008-12.",
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
          <h2>1. Responsable du traitement</h2>
          <p>
            XaalisPay, plateforme de paiement sécurisé par séquestre opérée par ADBA E-COM X LLC,
            est responsable du traitement de vos données personnelles dans le cadre de l&apos;utilisation
            de ses services au Sénégal.
          </p>
        </section>

        <section>
          <h2>2. Données collectées</h2>
          <p>Nous collectons uniquement les données nécessaires à l&apos;exécution du service :</p>
          <ul>
            <li>Numéro de téléphone (identification et authentification par OTP WhatsApp)</li>
            <li>Nom complet et informations de boutique (comptes vendeurs)</li>
            <li>Données de transaction : montants, références commandes, statuts</li>
            <li>Données de livraison : zones, adresses et codes de confirmation</li>
            <li>Journaux de connexion et d&apos;activité (sécurité et prévention de la fraude)</li>
          </ul>
        </section>

        <section>
          <h2>3. Finalités du traitement</h2>
          <ul>
            <li>Exécution du service de séquestre et de paiement sécurisé</li>
            <li>Authentification des utilisateurs par code OTP WhatsApp</li>
            <li>Gestion des commandes, litiges et remboursements</li>
            <li>Calcul et versement des commissions d&apos;affiliation</li>
            <li>Prévention de la fraude et sécurisation des comptes</li>
            <li>Amélioration du service et support client</li>
          </ul>
        </section>

        <section>
          <h2>4. Base légale</h2>
          <p>
            Le traitement est fondé sur l&apos;exécution du contrat de service (article 4 de la loi
            n°2008-12 sur la protection des données personnelles) et le respect des obligations
            légales applicables aux prestataires de paiement au Sénégal.
          </p>
        </section>

        <section>
          <h2>5. Partage des données</h2>
          <p>
            Vos données ne sont pas vendues. Elles peuvent être communiquées uniquement aux
            sous-traitants suivants dans le cadre strict de l&apos;exécution du service :
          </p>
          <ul>
            <li>
              <strong>Twilio</strong> — envoi des codes OTP par WhatsApp (numéro de téléphone uniquement)
            </li>
            <li>
              <strong>Wave / Orange Money</strong> — prestataires de paiement mobile pour l&apos;encaissement et les retraits
            </li>
            <li>
              <strong>Railway</strong> — hébergement sécurisé de l&apos;infrastructure technique
            </li>
            <li>
              <strong>Cloudinary</strong> — stockage des images produit des boutiques vendeurs
            </li>
          </ul>
          <p>
            Aucun transfert de données hors de l&apos;espace CEDEAO n&apos;est effectué sans garanties
            appropriées conformément à la réglementation de la CDP.
          </p>
        </section>

        <section>
          <h2>6. Durée de conservation</h2>
          <ul>
            <li>Données de compte actif : durée de la relation commerciale</li>
            <li>Données de transaction : 5 ans à compter de la transaction (obligation comptable)</li>
            <li>
              Compte supprimé : anonymisation sous 30 jours, sauf conservation requise par la loi
            </li>
            <li>Journaux de connexion : 12 mois</li>
          </ul>
        </section>

        <section>
          <h2>7. Sécurité</h2>
          <p>
            Toutes les communications sont chiffrées via TLS. Les tokens d&apos;accès et PIN sont
            stockés dans le trousseau sécurisé de l&apos;appareil (Keychain iOS / Keystore Android).
            Les PIN ne sont jamais stockés en clair ; ils sont hachés avant toute persistance. L&apos;accès
            à la production est restreint par rôle et tracé.
          </p>
        </section>

        <section>
          <h2>8. Cookies et traceurs</h2>
          <p>
            XaalisPay n&apos;utilise pas de cookies publicitaires ni de traceurs tiers à des fins
            marketing. Des cookies fonctionnels strictement nécessaires (session, sécurité CSRF)
            peuvent être utilisés sur le site web.
          </p>
        </section>

        <section>
          <h2>9. Vos droits (loi n°2008-12)</h2>
          <p>Conformément à la loi sénégalaise sur la protection des données personnelles, vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Droit d&apos;accès</strong> : obtenir une copie de vos données</li>
            <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
            <li><strong>Droit à l&apos;effacement</strong> : demander la suppression de votre compte</li>
            <li><strong>Droit d&apos;opposition</strong> : vous opposer à certains traitements</li>
            <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format lisible</li>
          </ul>
          <p>
            Pour exercer ces droits, contactez-nous à{" "}
            <a href="mailto:conctact@xaalispay.com" className="content-link">
              conctact@xaalispay.com
            </a>
            . Nous répondons dans un délai de 30 jours.
          </p>
        </section>

        <section>
          <h2>10. Suppression de compte</h2>
          <p>
            Vous pouvez demander la suppression de votre compte depuis l&apos;application (Paramètres →
            Supprimer mon compte) ou en écrivant à{" "}
            <a href="mailto:conctact@xaalispay.com" className="content-link">
              conctact@xaalispay.com
            </a>
            . Les données de transaction requises par la loi seront conservées sous forme anonymisée.
          </p>
        </section>

        <section>
          <h2>11. Autorité de contrôle</h2>
          <p>
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une
            réclamation auprès de la Commission de Protection des Données Personnelles (CDP) du
            Sénégal —{" "}
            <a
              href="https://www.cdp.sn"
              className="content-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.cdp.sn
            </a>
            .
          </p>
        </section>

        <section>
          <h2>12. Contact</h2>
          <p>
            Pour toute question relative à la protection de vos données personnelles :{" "}
            <a href="mailto:conctact@xaalispay.com" className="content-link">
              conctact@xaalispay.com
            </a>
          </p>
        </section>
      </div>
    </article>
  );
}
