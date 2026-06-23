import { customAlphabet } from "nanoid";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/max";
import type { Order } from "./types";

// Région par défaut tant que l'UI n'a pas de sélecteur de pays — seul point
// à changer le jour où XaalisPay s'ouvre à un marché où les vendeurs tapent
// leur numéro local sans indicatif (ex. Côte d'Ivoire -> "CI"). Même moteur
// (libphonenumber) que le backend (apps.accounts.services.normalize_phone)
// pour que la validation client ne dérive jamais de celle du serveur.
const DEFAULT_PHONE_REGION: CountryCode = "SN";

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
  if (region === "SN" && !digits.startsWith("+") && !digits.startsWith("221")) {
    digits = digits.replace(/^0+/, "");
  }
  const parsed = parsePhoneNumberFromString(digits, region);
  if (!parsed?.isValid()) return null;
  const type = parsed.getType();
  if (type !== "MOBILE" && type !== "FIXED_LINE_OR_MOBILE") return null;
  return parsed;
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
