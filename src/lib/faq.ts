export type FaqItem = { q: string; a: string };

export const LANDING_FAQ: FaqItem[] = [
  {
    q: "Combien coûte XaalisPay ?",
    a: "Inscription et boutique gratuites. Acheteur : 1 % de protection séquestre (max 500 FCFA), affiché au checkout. Vendeur : 2 % prélevés uniquement à la libération. Retrait Wave/Orange : 1,5 % + 75 FCFA, montant net affiché avant confirmation. Aucun frais caché.",
  },
  {
    q: "Y a-t-il des frais cachés pour l'acheteur ?",
    a: "Non. Le total à payer (commande + protection séquestre) est affiché avant Wave ou Orange Money. Le vendeur ne voit jamais vos coordonnées de paiement.",
  },
  {
    q: "Que se passe-t-il si le vendeur n'envoie jamais le colis ?",
    a: "L'argent n'est jamais versé au vendeur tant que vous n'avez pas validé la réception. En l'absence de livraison dans les délais, vous êtes intégralement remboursé, frais de protection inclus.",
  },
  {
    q: "Mes données bancaires sont-elles partagées avec le vendeur ?",
    a: "Jamais. Vous payez via Wave ou Orange Money, et le vendeur ne voit aucune information de paiement. XaalisPay agit comme tiers de confiance.",
  },
  {
    q: "Quand le vendeur reçoit-il son argent ?",
    a: "Dès que le livreur valide le code PIN à la réception, puis à l'issue du Séquestre Flash de 30 minutes sans litige. La commission de 2 % est déduite à ce moment.",
  },
  {
    q: "Dois-je créer un compte ou télécharger une application ?",
    a: "Non. En tant qu'acheteur, vous payez en un clic via Wave, Orange Money ou Free Money, sans inscription ni application.",
  },
  {
    q: "Comment ouvrir un litige ?",
    a: "Après réception, vous disposez de 30 minutes pour signaler un problème depuis le suivi de commande. Notre équipe examine les preuves et tranche rapidement.",
  },
];
