export type BlogSection =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: "Acheteurs" | "Vendeurs" | "Sécurité" | "Guides";
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  sections: BlogSection[];
};

const POSTS: BlogPost[] = [
  {
    slug: "acheter-en-securite-instagram-senegal",
    title: "Comment acheter en sécurité sur Instagram au Sénégal",
    description:
      "Guide pratique pour éviter les arnaques sur Instagram : vérifications, paiement sécurisé, séquestre et recours en cas de litige.",
    category: "Acheteurs",
    publishedAt: "2026-06-01",
    updatedAt: "2026-06-01",
    readingTime: 6,
    sections: [
      {
        type: "p",
        text: "Instagram est devenu une véritable vitrine commerciale à Dakar et dans tout le Sénégal. Robes, chaussures, téléphones, cosmétiques : des milliers de ventes se concluent chaque jour en message privé. Le problème ? Une partie significative se termine en arnaque — paiement envoyé, vendeur disparu.",
      },
      {
        type: "h2",
        text: "Les signaux d'alerte avant de payer",
      },
      {
        type: "ul",
        items: [
          "Compte récent sans historique ni avis vérifiables",
          "Pression pour payer immédiatement (« dernière pièce », « offre expire ce soir »)",
          "Refus de tout paiement sécurisé ou tiers de confiance",
          "Numéro WhatsApp différent du compte Instagram",
          "Prix anormalement bas par rapport au marché",
        ],
      },
      {
        type: "h2",
        text: "Pourquoi le paiement direct Wave ou Orange Money est risqué",
      },
      {
        type: "p",
        text: "Wave et Orange Money sont rapides — c'est leur force et leur faiblesse. Une fois l'argent transféré directement au vendeur, vous n'avez plus de levier. Même avec une capture d'écran de conversation, le recours est long et incertain. Le séquestre inverse la logique : l'argent est bloqué chez un tiers de confiance jusqu'à réception du colis.",
      },
      {
        type: "h2",
        text: "La bonne pratique : payer via un lien sécurisé",
      },
      {
        type: "p",
        text: "Demandez au vendeur un lien XaalisPay. Vous payez en un clic via Wave ou Orange Money, mais les fonds restent en séquestre. Vous recevez un code PIN à donner uniquement après avoir le colis en main. Pas de livraison ? Remboursement. Produit non conforme ? Litige sous 30 minutes.",
      },
      {
        type: "h2",
        text: "Checklist avant chaque achat Instagram",
      },
      {
        type: "ul",
        items: [
          "Vérifier que le vendeur a une boutique XaalisPay ou un XaalisTag",
          "Demander des photos réelles du produit (pas seulement des visuels catalogue)",
          "Confirmer les frais de livraison et le délai par écrit",
          "Ne jamais payer 100 % à l'avance sans séquestre",
          "Conserver les échanges WhatsApp comme preuve",
        ],
      },
    ],
  },
  {
    slug: "quest-ce-que-le-sequestre-paiement",
    title: "Qu'est-ce que le séquestre de paiement ?",
    description:
      "Définition du séquestre (escrow), son fonctionnement au Sénégal et pourquoi il protège acheteurs et vendeurs honnêtes.",
    category: "Guides",
    publishedAt: "2026-06-02",
    updatedAt: "2026-06-02",
    readingTime: 5,
    sections: [
      {
        type: "p",
        text: "Le séquestre — ou escrow en anglais — est un mécanisme où l'argent d'une transaction est temporairement détenu par un tiers neutre. Ni l'acheteur ni le vendeur ne peut y toucher tant que les conditions convenues ne sont pas remplies.",
      },
      {
        type: "h2",
        text: "Comment ça marche concrètement",
      },
      {
        type: "ul",
        items: [
          "L'acheteur paie via mobile money (Wave, Orange Money, Free Money)",
          "Les fonds sont bloqués sur un compte séquestre XaalisPay",
          "Le vendeur expédie sachant que l'argent est garanti",
          "À la livraison, l'acheteur communique un code PIN au livreur",
          "Après 30 minutes sans litige, le vendeur reçoit son paiement",
        ],
      },
      {
        type: "h2",
        text: "Pourquoi c'est adapté au Sénégal",
      },
      {
        type: "p",
        text: "Le commerce social — Instagram, TikTok, WhatsApp — représente une part énorme des ventes en ligne au Sénégal. Mais la confiance entre inconnus est fragile. Le séquestre recrée la sécurité d'un achat en boutique, sans compte bancaire ni carte internationale.",
      },
      {
        type: "h2",
        text: "Séquestre vs paiement direct",
      },
      {
        type: "p",
        text: "En paiement direct, le vendeur malhonnête disparaît après encaissement. En séquestre, il n'a aucun intérêt à ne pas livrer : l'argent l'attend déjà. Pour le vendeur honnête, c'est un argument de vente : « Payez via XaalisPay, vous êtes protégés. »",
      },
    ],
  },
  {
    slug: "arnaques-whatsapp-senegal-comment-eviter",
    title: "Arnaques WhatsApp au Sénégal : 7 astuces pour ne plus se faire avoir",
    description:
      "Les arnaques par WhatsApp explosent au Sénégal. Voici comment les repérer et vous protéger avec un paiement sécurisé.",
    category: "Sécurité",
    publishedAt: "2026-06-03",
    updatedAt: "2026-06-03",
    readingTime: 7,
    sections: [
      {
        type: "p",
        text: "« Envoie 10 000 FCFA par Wave, je te livre demain à Medina. » Vous connaissez ce message. Parfois la livraison arrive. Souvent, le numéro devient injoignable. Les arnaques WhatsApp touchent étudiants, mères de famille et entrepreneurs — personne n'est à l'abri.",
      },
      {
        type: "h2",
        text: "Les 7 astuces essentielles",
      },
      {
        type: "ul",
        items: [
          "Ne jamais payer un inconnu sans séquestre ou preuve solide",
          "Méfiez-vous des photos volées (recherche image inverse sur Google)",
          "Exigez un lien de paiement traçable, pas un numéro perso",
          "Refusez les acomptes « frais de livraison seulement » sur gros montants",
          "Vérifiez que le vendeur existe sur plusieurs plateformes",
          "Signalez les comptes suspects à Instagram et WhatsApp",
          "Utilisez XaalisPay pour bloquer les fonds jusqu'à réception",
        ],
      },
      {
        type: "h2",
        text: "Que faire si vous avez déjà payé ?",
      },
      {
        type: "p",
        text: "Contactez immédiatement Wave ou Orange Money pour signaler la fraude — les chances de récupération sont faibles en paiement direct. À l'avenir, privilégiez systématiquement un tiers de confiance. C'est exactement pour cela que XaalisPay existe.",
      },
    ],
  },
  {
    slug: "vendre-en-ligne-lien-paiement-securise",
    title: "Vendre en ligne au Sénégal : créer un lien de paiement sécurisé",
    description:
      "Guide vendeur : XaalisTag, liens de paiement partageables sur Instagram et WhatsApp, séquestre et réception des fonds.",
    category: "Vendeurs",
    publishedAt: "2026-06-04",
    updatedAt: "2026-06-04",
    readingTime: 6,
    sections: [
      {
        type: "p",
        text: "Vous vendez sur Instagram mais vos clients hésitent à payer avant la livraison ? C'est normal — ils ont peur des arnaques. Un lien de paiement sécurisé rassure l'acheteur et augmente votre taux de conversion.",
      },
      {
        type: "h2",
        text: "Créer votre boutique XaalisPay en 5 minutes",
      },
      {
        type: "ul",
        items: [
          "Inscrivez-vous gratuitement sur xaalispay.com",
          "Choisissez votre XaalisTag (ex : xaalispay.com/seller/votre-nom)",
          "Ajoutez vos produits avec photo, prix et frais de livraison",
          "Partagez le lien produit ou boutique sur Instagram, TikTok, WhatsApp",
          "Recevez vos fonds dès validation livraison + Séquestre Flash",
        ],
      },
      {
        type: "h2",
        text: "Pourquoi les clients préfèrent payer via XaalisPay",
      },
      {
        type: "p",
        text: "L'acheteur sait que son argent ne part pas dans la nature. Vous, vendeur sérieux, gagnez en crédibilité. Fini les « je te paie à la livraison en espèces » qui font fuir les clients en dehors de Dakar.",
      },
      {
        type: "h2",
        text: "Commission transparente",
      },
      {
        type: "p",
        text: "Inscription et boutique gratuites. XaalisPay prélève une commission uniquement sur les ventes validées. Vous ne payez rien tant que vous ne vendez pas.",
      },
    ],
  },
  {
    slug: "wave-orange-money-achat-en-ligne",
    title: "Wave vs Orange Money : quel moyen de paiement pour acheter en ligne ?",
    description:
      "Comparatif Wave, Orange Money et Free Money pour vos achats en ligne sécurisés au Sénégal avec séquestre XaalisPay.",
    category: "Guides",
    publishedAt: "2026-06-05",
    updatedAt: "2026-06-05",
    readingTime: 5,
    sections: [
      {
        type: "p",
        text: "Au Sénégal, le mobile money domine les paiements du quotidien. Wave, Orange Money et Free Money couvrent la quasi-totalité de la population connectée. Mais utiliser ces outils en paiement direct pour des achats en ligne reste risqué.",
      },
      {
        type: "h2",
        text: "Wave : rapidité et simplicité",
      },
      {
        type: "p",
        text: "Wave est plébiscité pour sa fluidité et ses frais réduits. Idéal pour payer via XaalisPay : vous gardez la simplicité Wave, avec la protection du séquestre.",
      },
      {
        type: "h2",
        text: "Orange Money : la couverture nationale",
      },
      {
        type: "p",
        text: "Orange Money reste omniprésent, y compris hors Dakar. XaalisPay accepte Orange Money pour que vos clients en région puissent acheter en sécurité.",
      },
      {
        type: "h2",
        text: "La règle d'or",
      },
      {
        type: "p",
        text: "Peu importe l'opérateur choisi : ce qui compte, c'est de ne jamais envoyer l'argent directement à un vendeur inconnu. Passez toujours par un lien XaalisPay pour activer le séquestre.",
      },
    ],
  },
  {
    slug: "ouvrir-litige-ecommerce-senegal",
    title: "Comment ouvrir un litige e-commerce au Sénégal",
    description:
      "Procédure XaalisPay pour signaler un colis non conforme, obtenir un remboursement et comprendre le Séquestre Flash 30 minutes.",
    category: "Acheteurs",
    publishedAt: "2026-06-06",
    updatedAt: "2026-06-06",
    readingTime: 4,
    sections: [
      {
        type: "p",
        text: "Vous avez payé via XaalisPay, reçu un colis abîmé ou différent de la commande ? Le Séquestre Flash vous laisse 30 minutes après la livraison pour ouvrir un litige avant libération des fonds au vendeur.",
      },
      {
        type: "h2",
        text: "Étapes pour ouvrir un litige",
      },
      {
        type: "ul",
        items: [
          "Conservez le code PIN jusqu'à inspection complète du colis",
          "Si problème : allez sur xaalispay.com/litige",
          "Saisissez votre code PIN de commande",
          "Décrivez le problème et joignez des photos si possible",
          "L'équipe XaalisPay examine et tranche sous 48 h",
        ],
      },
      {
        type: "h2",
        text: "Cas de remboursement automatique",
      },
      {
        type: "p",
        text: "Pas de livraison dans les délais convenus ? Remboursement intégral sans litige à ouvrir. C'est la garantie du séquestre : l'argent ne quitte jamais XaalisPay tant que vous n'êtes pas satisfait.",
      },
    ],
  },
  {
    slug: "tiers-de-confiance-paiement-mobile-senegal",
    title: "Pourquoi le Sénégal a besoin d'un tiers de confiance pour le paiement mobile",
    description:
      "Analyse du commerce social au Sénégal et du rôle des plateformes de séquestre comme XaalisPay dans la confiance numérique.",
    category: "Guides",
    publishedAt: "2026-06-07",
    updatedAt: "2026-06-07",
    readingTime: 6,
    sections: [
      {
        type: "p",
        text: "Le Sénégal compte des millions d'utilisateurs actifs de mobile money, mais le commerce en ligne reste miné par la méfiance. Les plateformes internationales (PayPal, Stripe) ne couvrent pas la réalité sénégalaise. Il fallait une solution locale.",
      },
      {
        type: "h2",
        text: "Le commerce social sans filet",
      },
      {
        type: "p",
        text: "Instagram et WhatsApp ne sont pas des marketplaces. Il n'y a pas de protection acheteur native. Chaque transaction est un pari entre deux inconnus. Le tiers de confiance comble ce vide institutionnel.",
      },
      {
        type: "h2",
        text: "XaalisPay : pensé pour Dakar, Thiès, Saint-Louis…",
      },
      {
        type: "p",
        text: "Paiement Wave et Orange Money, livraison moto-taxi, litiges en français avec preuves WhatsApp — XaalisPay parle la langue du commerce sénégalais, pas celle de la Silicon Valley.",
      },
      {
        type: "h2",
        text: "Conformité et confiance",
      },
      {
        type: "p",
        text: "XaalisPay opère dans le cadre réglementaire de la BCEAO. Pour les vendeurs comme pour les acheteurs, c'est la garantie d'un acteur structuré, pas d'un simple intermédiaire informel.",
      },
    ],
  },
  {
    slug: "code-pin-livraison-sequestre-flash",
    title: "Code PIN et Séquestre Flash : comment XaalisPay protège votre argent",
    description:
      "Explication du code PIN à la livraison et du Séquestre Flash 30 minutes — les deux mécanismes clés de protection XaalisPay.",
    category: "Sécurité",
    publishedAt: "2026-06-08",
    updatedAt: "2026-06-08",
    readingTime: 5,
    sections: [
      {
        type: "p",
        text: "Deux innovations simples protègent chaque transaction XaalisPay : le code PIN remis au livreur uniquement après inspection du colis, et le Séquestre Flash qui bloque les fonds 30 minutes de plus pour détecter un litige.",
      },
      {
        type: "h2",
        text: "Le code PIN : vous gardez le contrôle",
      },
      {
        type: "p",
        text: "Après paiement, vous recevez un code PIN secret. Ne le communiquez au livreur qu'une fois le colis ouvert et vérifié. Sans ce code, le vendeur ne peut pas déclencher la libération des fonds.",
      },
      {
        type: "h2",
        text: "Le Séquestre Flash : 30 minutes pour réagir",
      },
      {
        type: "p",
        text: "Même après validation du code PIN, XaalisPay retient les fonds 30 minutes. Colis abîmé découvert après ouverture ? Ouvrez un litige immédiatement. Passé ce délai sans incident, le vendeur est payé instantanément.",
      },
      {
        type: "h2",
        text: "Pour les vendeurs honnêtes",
      },
      {
        type: "p",
        text: "Ces mécanismes ne pénalisent pas les bons vendeurs — ils filtrent la méfiance. Un client rassuré achète plus. Et vous recevez votre argent en automatique dès que tout est OK.",
      },
    ],
  },
  {
    slug: "paiement-sequestre-instagram-dakar-2026",
    title: "Paiement séquestre Instagram à Dakar : le guide 2026",
    description:
      "Pourquoi les vendeurs et acheteurs d'Instagram à Dakar passent au séquestre XaalisPay — cas concrets, étapes et erreurs à éviter.",
    category: "Guides",
    publishedAt: "2026-06-10",
    updatedAt: "2026-06-10",
    readingTime: 7,
    sections: [
      {
        type: "p",
        text: "En 2026, une grande partie du e-commerce sénégalais se joue encore en DM Instagram. Le problème n'est pas le canal — c'est l'absence de garantie quand l'argent part directement sur Wave ou Orange Money.",
      },
      {
        type: "h2",
        text: "Le scénario classique (et dangereux)",
      },
      {
        type: "p",
        text: "L'acheteur hésite à payer avant livraison. Le vendeur refuse d'expédier sans acompte. Résultat : vente perdue ou arnaque. Le séquestre coupe ce nœud gordien.",
      },
      {
        type: "h2",
        text: "Comment structurer une vente Instagram avec XaalisPay",
      },
      {
        type: "ul",
        items: [
          "Publier le produit avec photo et prix dans votre boutique XaalisPay",
          "Envoyer le lien de paiement en DM (pas votre numéro perso)",
          "L'acheteur paie — fonds bloqués en séquestre",
          "Vous livrez sachant que l'argent est garanti",
          "Code PIN + Séquestre Flash 30 min pour protéger les deux parties",
        ],
      },
      {
        type: "h2",
        text: "Argument vendeur qui convertit",
      },
      {
        type: "p",
        text: "« Payez via XaalisPay, votre argent est protégé jusqu'à réception. » Cette phrase rassure les clients méfiants et augmente le taux de closing sur les ventes à distance.",
      },
    ],
  },
  {
    slug: "vendeur-en-ligne-wave-orange-sequestre",
    title: "Vendeur en ligne : recevoir Wave et Orange Money en séquestre",
    description:
      "Comment encaisser Wave et Orange Money sans risque d'impayé ni litige — workflow vendeur XaalisPay étape par étape.",
    category: "Vendeurs",
    publishedAt: "2026-06-12",
    updatedAt: "2026-06-12",
    readingTime: 6,
    sections: [
      {
        type: "p",
        text: "Wave et Orange Money sont parfaits pour encaisser vite — mais en paiement direct, vous n'avez aucune preuve structurée de la commande. XaalisPay transforme ces mêmes moyens de paiement en flux professionnel avec séquestre.",
      },
      {
        type: "h2",
        text: "Ce que vous gagnez comme vendeur",
      },
      {
        type: "ul",
        items: [
          "Commande tracée (produit, client, montant, statut)",
          "Fonds garantis avant expédition",
          "Réception automatique après validation livraison",
          "Retrait Wave/Orange depuis votre portefeuille vendeur",
          "Historique des mouvements et retraits",
        ],
      },
      {
        type: "h2",
        text: "Bonnes pratiques pour limiter les litiges",
      },
      {
        type: "p",
        text: "Photo réelle du produit, délai de livraison réaliste, réponse rapide sur WhatsApp. Un vendeur transparent a moins de litiges — et un meilleur taux de conversion grâce à la confiance XaalisPay.",
      },
    ],
  },
];

export function getAllBlogPosts(): BlogPost[] {
  return [...POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function getBlogSlugs(): string[] {
  return POSTS.map((p) => p.slug);
}
