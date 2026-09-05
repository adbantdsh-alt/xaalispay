import { customAlphabet } from "nanoid";
import { getExampleNumber, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/max";
import examplePhoneNumbers from "libphonenumber-js/examples.mobile.json";
import type { Order } from "./types";

// Région par défaut quand aucun contexte pays n'est disponible (rare, voir
// call sites — la plupart passent déjà `country` depuis le sélecteur pays).
// Même moteur (libphonenumber) que le backend
// (apps.accounts.services.normalize_phone) pour que la validation client ne
// dérive jamais de celle du serveur.
const DEFAULT_PHONE_REGION: CountryCode = "SN";

// Miroir de apps.accounts.services._LOCAL_ZERO_STRIP_REGIONS — pays où la
// saisie locale commence par un "0" à dégrouper avant parsing. Ne pas
// étendre sans la même vérification empirique côté backend.
const LOCAL_ZERO_STRIP_REGIONS: ReadonlySet<CountryCode> = new Set(["SN"]);

const pinAlphabet = customAlphabet("0123456789", 4);

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("XOF", "FCFA");
}

/** Sépare "47 500 FCFA" en ["47 500", "FCFA"] pour estomper le suffixe à
 * l'affichage — retombe sur le texte plein si le format ne matche pas. */
export function splitCurrency(amount: number): [string, string] {
  const formatted = formatCurrency(amount);
  const match = formatted.match(/^([\d\s .,]+)\s*(\D+)$/);
  return match ? [match[1].trim(), match[2].trim()] : [formatted, ""];
}

/** Code factice pour la page de démo statique (orderlink/preview) — le vrai
 * PIN est généré côté Django (apps.orders.services.generate_pin). */
export function generatePin(): string {
  return pinAlphabet();
}

export function getOrderTotal(
  order: Pick<Order, "productPrice" | "deliveryCost">
): number {
  return order.productPrice + (order.deliveryCost || 0);
}

export function formatDeliveryHours(hours: number): string {
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  if (rest === 0) return `${days} j`;
  return `${days} j ${rest} h`;
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

/** Numéro local Sénégal sans indicatif (+221) — usage interne, affichage uniquement. */
export function normalizeSenegalPhoneLocal(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  while (digits.startsWith("221") && digits.length > 9) {
    digits = digits.slice(3);
  }
  return digits.replace(/^0+/, "");
}

function parseMobilePhone(phone: string, region: CountryCode = DEFAULT_PHONE_REGION) {
  let digits = phone.replace(/[^\d+]/g, "");
  if (LOCAL_ZERO_STRIP_REGIONS.has(region) && !digits.startsWith("+") && !digits.startsWith("221")) {
    digits = digits.replace(/^0+/, "");
  }
  const parsed = parsePhoneNumberFromString(digits, region);
  if (!parsed?.isValid()) return null;
  const type = parsed.getType();
  if (type !== "MOBILE" && type !== "FIXED_LINE_OR_MOBILE") return null;
  return parsed;
}

/** Formatage national lisible ("77 000 00 01"), en s'appuyant sur les
 * métadonnées libphonenumber réelles du pays plutôt qu'un découpage à 9
 * chiffres codé pour le Sénégal — fonctionne correctement pour les numéros
 * ivoiriens (10 chiffres), maliens/béninois/togolais, etc. Retombe sur le
 * numéro brut si non parsable. */
export function formatPhoneDisplay(phone: string, region: CountryCode = DEFAULT_PHONE_REGION): string {
  const parsed = parseMobilePhone(phone, region);
  return parsed ? parsed.formatNational() : phone;
}

/** Vrai si `phone` est un numéro mobile valide pour `region` (SN par défaut). */
export function isValidMobilePhone(phone: string, region: CountryCode = DEFAULT_PHONE_REGION): boolean {
  return parseMobilePhone(phone, region) !== null;
}

export function formatSenegalPhoneDisplay(phone: string): string {
  const local = normalizeSenegalPhoneLocal(phone);
  if (local.length !== 9) return phone;
  return `${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
}

/** Pays où XaalisPay opère — miroir de apps.common.constants.Country côté
 * backend. Utilisé par le sélecteur pays (inscription) et pour retrouver
 * l'indicatif d'affichage d'un vendeur existant (ex. wallet, settings).
 * `locative` : forme grammaticale correcte ("au Sénégal" vs "en Côte
 * d'Ivoire", le genre variant par pays) — à utiliser dans toute copie
 * plutôt que de construire "en {label}" à la main. */
export const COUNTRIES: { code: CountryCode; dial: string; flag: string; label: string; locative: string }[] = [
  { code: "SN", dial: "+221", flag: "🇸🇳", label: "Sénégal", locative: "au Sénégal" },
  { code: "CI", dial: "+225", flag: "🇨🇮", label: "Côte d'Ivoire", locative: "en Côte d'Ivoire" },
  { code: "ML", dial: "+223", flag: "🇲🇱", label: "Mali", locative: "au Mali" },
  { code: "BJ", dial: "+229", flag: "🇧🇯", label: "Bénin", locative: "au Bénin" },
  { code: "TG", dial: "+228", flag: "🇹🇬", label: "Togo", locative: "au Togo" },
  { code: "BF", dial: "+226", flag: "🇧🇫", label: "Burkina Faso", locative: "au Burkina Faso" },
];

export function dialCodeFor(region: CountryCode | string): string {
  return COUNTRIES.find((c) => c.code === region)?.dial ?? "+221";
}

export function countryLocative(region: CountryCode | string): string {
  return COUNTRIES.find((c) => c.code === region)?.locative ?? "au Sénégal";
}

// Un placeholder unique ("77 123 45 67") n'a de sens que pour le Sénégal —
// la Côte d'Ivoire est passée à 10 chiffres en 2021, le Bénin à 10 chiffres
// aussi, etc. On utilise le vrai numéro d'exemple mobile de libphonenumber
// (metadata Google, pas une devinette) plutôt que de coder chaque format à
// la main. Mise en cache car getExampleNumber recalcule à chaque appel.
const phonePlaceholderCache = new Map<string, string>();

export function phonePlaceholderFor(region: CountryCode | string): string {
  const cached = phonePlaceholderCache.get(region);
  if (cached) return cached;
  try {
    const example = getExampleNumber(region as CountryCode, examplePhoneNumbers);
    const placeholder = example?.formatNational() ?? "77 123 45 67";
    phonePlaceholderCache.set(region, placeholder);
    return placeholder;
  } catch {
    return "77 123 45 67";
  }
}

/** Format E.164 attendu par le backend (Profile.phone, identifiant de
 * connexion) — à appeler après isValidMobilePhone(). Retombe sur l'ancien
 * format best-effort (Sénégal) si le numéro n'est plus parsable à ce
 * stade, pour ne jamais lever côté UI. */
export function toE164(phone: string, region: CountryCode = DEFAULT_PHONE_REGION): string {
  return parseMobilePhone(phone, region)?.number ?? `+221${normalizeSenegalPhoneLocal(phone)}`;
}

export function slugifyUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
}
