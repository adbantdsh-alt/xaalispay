import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales — XaalisPay",
};

export default function CgvPage() {
  return (
    <article className="content-page legal-page">
      <header className="content-hero">
        <p className="section-label">Légal</p>
        <h1 className="content-title">Conditions générales d&apos;utilisation</h1>
        <p className="content-lead">Dernière mise à jour : juin 2026</p>
      </header>

      <div className="glass-card legal-body">
        <section>
          <h2>1. Objet</h2>
          <p>
            XaalisPay est une plateforme de paiement sécurisé par séquestre permettant aux
            acheteurs de régler des commandes auprès de vendeurs inscrits, et aux vendeurs de
            recevoir des paiements après validation de la livraison, sous réserve des règles de
            protection et de litige décrites ci-dessous.
          </p>
        </section>

        <section>
          <h2>2. Rôle de XaalisPay</h2>
          <p>
            XaalisPay agit en qualité de tiers de confiance : les fonds payés par l&apos;acheteur
            sont conservés en séquestre jusqu&apos;à libération au vendeur ou remboursement à
            l&apos;acheteur, conformément au statut de la commande.
          </p>
        </section>

        <section>
          <h2>3. Obligations de l&apos;acheteur</h2>
          <ul>
            <li>Ne communiquer le code PIN de livraison qu&apos;après réception effective du colis.</li>
            <li>Vérifier le produit avant de transmettre le PIN au vendeur.</li>
            <li>Ouvrir un litige pendant le délai du Séquestre Flash en cas de problème avéré.</li>
          </ul>
        </section>

        <section>
          <h2>4. Obligations du vendeur</h2>
          <ul>
            <li>Expédier le produit dans le délai annoncé.</li>
            <li>Valider la livraison uniquement avec le PIN fourni par l&apos;acheteur.</li>
            <li>Ne pas demander de paiement en dehors de XaalisPay pour une commande initiée sur la plateforme.</li>
          </ul>
        </section>

        <section>
          <h2>5. Séquestre Flash et litiges</h2>
          <p>
            Après validation du PIN par le vendeur, une période de protection (Séquestre Flash)
            s&apos;ouvre pendant laquelle l&apos;acheteur peut signaler un litige. À l&apos;issue
            de cette période sans litige, les fonds sont libérés au vendeur.
          </p>
        </section>

        <section>
          <h2>6. Remboursements</h2>
          <p>
            Un remboursement automatique peut intervenir si le vendeur n&apos;a pas validé la
            livraison dans le délai contractuel défini pour la commande.
          </p>
        </section>

        <section>
          <h2>7. Limitation de responsabilité</h2>
          <p>
            XaalisPay ne peut être tenu responsable si l&apos;acheteur communique son code PIN avant
            réception du colis. La plateforme n&apos;est pas responsable de la qualité des produits
            vendus, mais met en œuvre les mécanismes de séquestre et de litige décrits.
          </p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            Pour toute question :{" "}
            <a href="mailto:contact@xaalispay.sn" className="content-link">
              contact@xaalispay.sn
            </a>
          </p>
        </section>
      </div>
    </article>
  );
}
