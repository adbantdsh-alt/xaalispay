export type FaqItem = { q: string; a: string };

export const LANDING_FAQ: FaqItem[] = [
  {
    q: "Pourquoi payer avant la livraison ?",
    a: "Parce que l'argent ne va pas au vendeur — il reste bloqué chez XaalisPay. Vous engagez votre commande, mais vous gardez le contrôle. Vous disposez de 30 minutes après la livraison pour vérifier votre colis et vous assurer que tout est conforme. Si ça ne l'est pas, vous ouvrez un litige. Si tout est ok, le vendeur est payé automatiquement. Aucune arnaque n'est possible.",
  },
  {
    q: "Combien coûte XaalisPay ?",
    a: "Inscription et boutique gratuites. Acheteur : 1 % de protection séquestre, affiché au checkout. Vendeur : 5 % prélevés uniquement à la libération des fonds — ce taux couvre la commission XaalisPay et le retrait, qui est 100 % gratuit. Aucun frais caché.",
  },
  {
    q: "Que se passe-t-il si le produit est défectueux ?",
    a: "Vous disposez de 30 minutes après la livraison pour ouvrir un litige, directement depuis le site ou la page de paiement. L'argent reste bloqué chez XaalisPay tant que la situation n'est pas résolue.",
  },
  {
    q: "Que se passe-t-il si le vendeur ne livre jamais ?",
    a: "Chaque vendeur dispose de 48 heures maximum pour livrer. S'il ne livre pas dans ce délai, votre commande est intégralement remboursée, frais de protection inclus, et le vendeur se voit appliquer des pénalités.",
  },
  {
    q: "Mes données bancaires sont-elles partagées avec le vendeur ?",
    a: "Jamais. Vous payez via Wave ou Orange Money, et le vendeur ne voit aucune information de paiement. XaalisPay agit comme tiers de confiance.",
  },
  {
    q: "Quand le vendeur reçoit-il son argent ?",
    a: "Dès que vous confirmez la réception, ou automatiquement à l'issue du Séquestre Flash de 30 minutes si aucun litige n'est ouvert. La commission de 5 % (qui couvre aussi le retrait, désormais gratuit) est déduite à ce moment.",
  },
  {
    q: "Comment ouvrir un litige ?",
    a: "Depuis le site, un bouton Litige est toujours visible. Et même depuis la page de paiement, une fois le paiement effectué, un bouton de litige reste disponible pour vous.",
  },
  {
    q: "Qui garde l'argent pendant la transaction ?",
    a: "XaalisPay. Ni le vendeur, ni l'acheteur n'y ont accès tant que la transaction n'est pas finalisée. L'argent est conservé en toute sécurité jusqu'à la validation du colis ou la résolution d'un éventuel litige.",
  },
];
