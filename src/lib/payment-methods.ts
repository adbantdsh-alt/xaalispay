export const MOBILE_MONEY_METHODS = [
  {
    id: "wave" as const,
    name: "Wave",
    shortName: "Wave",
    btnClass: "pay-method-wave",
    color: "#00D4FF",
  },
  {
    id: "orange" as const,
    name: "Orange Money",
    shortName: "Orange",
    btnClass: "pay-method-orange",
    color: "#FF7900",
  },
  {
    id: "mtn" as const,
    name: "MTN Money",
    shortName: "MTN",
    btnClass: "pay-method-mtn",
    color: "#FFCC00",
  },
  {
    id: "moov" as const,
    name: "Moov Money",
    shortName: "Moov",
    btnClass: "pay-method-moov",
    color: "#E68A00",
  },
  {
    id: "togocell" as const,
    name: "Togocell",
    shortName: "Togocell",
    btnClass: "pay-method-togocell",
    color: "#008A3E",
  },
  {
    id: "mobicash" as const,
    name: "Mobicash",
    shortName: "Mobicash",
    btnClass: "pay-method-mobicash",
    color: "#B0272D",
  },
  {
    id: "maxit" as const,
    name: "MaxIt",
    shortName: "MaxIt",
    btnClass: "pay-method-maxit",
    color: "#F26522",
  },
];

export type MobileMoneyMethod = (typeof MOBILE_MONEY_METHODS)[number]["id"];

const METHOD_IDS = new Set<string>(MOBILE_MONEY_METHODS.map((m) => m.id));

export function isMobileMoneyMethod(value: string): value is MobileMoneyMethod {
  return METHOD_IDS.has(value);
}

export const MOBILE_MONEY_LABELS: Record<MobileMoneyMethod, string> = Object.fromEntries(
  MOBILE_MONEY_METHODS.map((m) => [m.id, m.name])
) as Record<MobileMoneyMethod, string>;

/** Miroir de apps.payments.operators.OPERATORS_BY_COUNTRY côté backend — le
 * backend reste la seule source de vérité pour ce qui est réellement accepté
 * par Bictorys (voir get_bictorys_payment_type, qui rejette toute
 * combinaison absente même si elle apparaît ici) ; cette liste ne sert qu'à
 * savoir quels boutons afficher. Garder synchronisée manuellement si le
 * mapping backend change.
 * Statut de vérification (tests réels Bictorys, mars 2026) : SN et CI
 * confirmés fonctionnels. ML/BJ/TG activés côté produit à la demande
 * explicite de l'utilisateur, à vérifier/désactiver en prod si besoin.
 * BF (Burkina Faso) ajouté le 2026-08-24 sur la base de la page de paiement
 * hébergée Bictorys (capture d'écran réelle du compte marchand), qui montre
 * Moov/Wave/Orange actifs — les tests de mars 2026 avaient pourtant échoué
 * pour ce pays, le compte a visiblement été activé depuis. */
export const MOBILE_MONEY_METHODS_BY_COUNTRY: Record<string, MobileMoneyMethod[]> = {
  SN: ["wave", "orange", "maxit"],
  CI: ["wave", "orange", "mtn", "moov"],
  ML: ["orange", "mobicash"],
  BJ: ["mtn", "moov"],
  TG: ["togocell", "moov"],
  BF: ["moov", "wave", "orange"],
};

export function mobileMoneyMethodsForCountry(country: string): MobileMoneyMethod[] {
  return MOBILE_MONEY_METHODS_BY_COUNTRY[country] ?? MOBILE_MONEY_METHODS_BY_COUNTRY.SN;
}

/** Orange Money exige un OTP généré côté client (composer #144*82#) dans ces
 * pays uniquement — voir apps.payments.operators.ORANGE_OTP_REQUIRED_COUNTRIES
 * ("Orange Money CI et BF sont les seuls opérateurs qui nécessitent un code
 * OTP généré par le client", doc Bictorys). */
export function orangeRequiresOtp(country: string): boolean {
  return country === "CI" || country === "BF";
}
