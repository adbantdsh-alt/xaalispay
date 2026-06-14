import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Notre histoire — XaalisPay",
  description:
    "L'histoire de XaalisPay : une solution née de la frustration des arnaques en ligne au Sénégal.",
};

const CHAPTERS = [
  {
    year: "Le constat",
    title: "Encore une arnaque sur Instagram",
    body: `Vous voyez une robe parfaite sur Instagram. Le vendeur répond vite sur WhatsApp. « Envoyez 15 000 FCFA par Wave, je livre demain. » Vous payez. Le lendemain, le numéro ne répond plus. Le compte a disparu. Votre argent aussi.

Ce scénario, des milliers de Sénégalais le vivent chaque semaine. TikTok, Facebook, WhatsApp — les réseaux sociaux sont devenus de vraies vitrines commerciales, mais sans aucune protection pour l'acheteur.`,
  },
  {
    year: "La frustration",
    title: "Payer, puis attendre… et ne rien recevoir",
    body: `Orange Money, Wave, transfert direct : les moyens de paiement sont rapides. Trop rapides, parfois. Une fois l'argent envoyé, vous n'avez plus aucun levier. Pas de recours, pas de garantie, pas de preuve solide.

Certains vendeurs honnêtes souffrent aussi de cette méfiance : les clients hésitent à payer avant la livraison. Les bons commerçants perdent des ventes à cause des mauvais.`,
  },
  {
    year: "L'idée",
    title: "Et si l'argent attendait avec vous ?",
    body: `XaalisPay est né d'une question simple : pourquoi l'argent partirait-il directement chez le vendeur avant que vous ayez le colis entre les mains ?

Nous avons imaginé un tiers de confiance local : vos fonds restent en séquestre chez XaalisPay. Le vendeur sait que l'argent est là. Vous savez qu'il ne part pas tant que vous n'avez pas validé. Chacun gagne en sérénité.`,
  },
  {
    year: "La solution",
    title: "Séquestre, code PIN, Séquestre Flash",
    body: `Vous payez via Wave ou Orange Money — mais l'argent est bloqué. Vous recevez un code PIN à donner uniquement après réception du colis. Le vendeur valide la livraison, puis démarre le Séquestre Flash : 30 minutes pour signaler un problème.

Colis conforme ? Le vendeur est payé. Problème ? Litige. Pas de livraison dans les délais ? Remboursement automatique. C'est la promesse XaalisPay : payer les yeux fermés, ouvrir les yeux à la réception.`,
  },
  {
    year: "Aujourd'hui",
    title: "Pour les acheteurs et les vendeurs du Sénégal",
    body: `XaalisPay n'est pas une banque lointaine. C'est un outil pensé pour la réalité sénégalaise : ventes sur les réseaux, paiement mobile, livraison par moto-taxi ou coursiers.

Notre mission : que plus personne ne perde son argent à cause d'un vendeur malhonnête — et que les vendeurs sérieux puissent prouver leur professionnalisme en un lien de paiement sécurisé.`,
  },
];

export default function HistoirePage() {
  return (
    <article className="content-page">
      <header className="content-hero">
        <p className="section-label">Notre histoire</p>
        <h1 className="content-title">
          XaalisPay, né de la colère
          <br />
          d&apos;être arnaqué en ligne
        </h1>
        <p className="content-lead">
          Derrière chaque fonctionnalité, il y a une arnaque évitée, un colis reçu, un vendeur
          honnête qui a pu vendre en confiance.
        </p>
      </header>

      <div className="content-timeline">
        {CHAPTERS.map((chapter, i) => (
          <section key={chapter.year} className="glass-card content-chapter">
            <p className="content-chapter-year">{chapter.year}</p>
            <h2 className="content-chapter-title">{chapter.title}</h2>
            <p className="content-chapter-body">{chapter.body}</p>
            {i === CHAPTERS.length - 1 && (
              <Link href="/auth?mode=signup" className="btn-relief-blue mt-6 inline-flex">
                Rejoindre XaalisPay
              </Link>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
