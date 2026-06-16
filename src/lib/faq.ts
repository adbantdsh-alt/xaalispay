export type FaqItem = { q: string; a: string };

export const LANDING_FAQ: FaqItem[] = [
  {
    q: "Combien coûte XaalisPay ?",
    a: "L'inscription et la création de boutique sont gratuites. Une petite commission est prélevée uniquement lorsqu'une transaction est validée et libérée — vous ne payez jamais à l'avance.",
  },
  {
    q: "Que se passe-t-il si le vendeur n'envoie jamais le colis ?",
    a: "L'argent n'est jamais versé au vendeur tant que vous n'avez pas validé la réception. En l'absence de livraison dans les délais, vous êtes intégralement remboursé.",
  },
  {
    q: "Mes données bancaires sont-elles partagées avec le vendeur ?",
    a: "Jamais. Vous payez via Wave ou Orange Money, et le vendeur ne voit aucune information de paiement. XaalisPay agit comme tiers de confiance.",
  },
  {
    q: "Quand le vendeur reçoit-il son argent ?",
    a: "Dès que le livreur valide le code PIN à la réception, puis à l'issue du Séquestre Flash de 30 minutes sans litige, les fonds sont libérés instantanément.",
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
