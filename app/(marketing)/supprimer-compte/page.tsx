import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Supprimer mon compte",
  description:
    "Procédure de suppression de compte XaalisPay — demandez la suppression de votre compte et de vos données personnelles.",
  path: "/supprimer-compte",
});

export default function SupprimerComptePage() {
  return (
    <article className="content-page legal-page">
      <header className="content-hero">
        <p className="section-label">Compte</p>
        <h1 className="content-title">Supprimer mon compte XaalisPay</h1>
        <p className="content-lead">
          Vous pouvez demander la suppression de votre compte vendeur et de vos données
          personnelles à tout moment.
        </p>
      </header>

      <div className="glass-card legal-body">
        <section>
          <h2>Comment faire la demande</h2>
          <p>
            Envoyez un e-mail à{" "}
            <a href="mailto:support@xaalispay.com">support@xaalispay.com</a> depuis
            l'adresse associée à votre compte, avec l'objet{" "}
            <strong>« Suppression de mon compte XaalisPay »</strong>.
          </p>
          <p>
            Indiquez le numéro de téléphone rattaché à votre compte vendeur. Nous
            traiterons votre demande dans un délai de <strong>30 jours</strong>.
          </p>
        </section>

        <section>
          <h2>Données supprimées</h2>
          <p>À la suppression de votre compte, les données suivantes sont définitivement effacées :</p>
          <ul>
            <li>Vos informations de profil (nom, nom de boutique, adresse e-mail, numéro de téléphone)</li>
            <li>Votre code PIN et paramètres de sécurité (biométrie, code secret)</li>
            <li>Votre token de notification push</li>
            <li>Vos produits et liens de paiement</li>
            <li>Vos zones de livraison</li>
          </ul>
        </section>

        <section>
          <h2>Données conservées</h2>
          <p>
            Conformément à nos obligations légales et comptables, certaines données sont
            conservées après la suppression du compte :
          </p>
          <ul>
            <li>
              <strong>Historique des transactions et commandes</strong> — conservé{" "}
              <strong>5 ans</strong> à des fins comptables, fiscales et de lutte contre
              la fraude (obligations légales sénégalaises).
            </li>
            <li>
              <strong>Données de litige</strong> — conservées jusqu'à la résolution
              définitive de tout litige en cours, puis supprimées.
            </li>
          </ul>
        </section>

        <section>
          <h2>Conditions préalables</h2>
          <p>
            La suppression du compte est possible uniquement si :
          </p>
          <ul>
            <li>Aucune commande n'est en cours (statut en attente, séquestré ou en protection).</li>
            <li>Votre solde disponible est à zéro ou a été retiré via Wave.</li>
            <li>Aucun litige n'est ouvert sur votre compte.</li>
          </ul>
          <p>
            Si ces conditions ne sont pas remplies, nous vous contacterons pour régulariser
            la situation avant de procéder à la suppression.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Pour toute question relative à la suppression de vos données :{" "}
            <a href="mailto:support@xaalispay.com">support@xaalispay.com</a>
          </p>
        </section>
      </div>
    </article>
  );
}
