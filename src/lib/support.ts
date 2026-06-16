/** Numéro WhatsApp support pilote (ex. 221771234567, sans +). */
export function getSupportWhatsAppNumber(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim();
  if (!raw) return null;
  return raw.replace(/\D/g, "");
}

export function isSupportWhatsAppConfigured(): boolean {
  return !!getSupportWhatsAppNumber();
}

export function buildWhatsAppDirectUrl(phoneDigits: string, message?: string): string {
  const digits = phoneDigits.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function buildSupportWhatsAppUrl(message?: string): string | null {
  const number = getSupportWhatsAppNumber();
  if (!number) return null;
  const defaultMsg =
    message ||
    "Bonjour XaalisPay, j'ai besoin d'aide avec ma boutique pilote.";
  return buildWhatsAppDirectUrl(number, defaultMsg);
}

export function buildVendorSupportWhatsAppUrl(
  vendorPhone: string | null | undefined,
  vendorUsername: string
): string | null {
  if (!vendorPhone) return null;
  const digits = vendorPhone.replace(/\D/g, "");
  if (digits.length < 9) return null;
  const msg = `Bonjour @${vendorUsername}, l'équipe XaalisPay pilote vous contacte pour votre boutique.`;
  return buildWhatsAppDirectUrl(digits, msg);
}

export function buildSellerPilotSupportMessage(username: string, step?: string): string {
  const stepLine = step ? `\nÉtape bloquée : ${step}` : "";
  return `Bonjour XaalisPay, je suis vendeur pilote (@${username}) et j'ai besoin d'aide.${stepLine}`;
}

/** Afficher la bannière support les N premiers jours après inscription. */
export const PILOT_SUPPORT_DAYS = 14;

export function isWithinPilotSupportWindow(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  const days = (Date.now() - created) / (24 * 60 * 60 * 1000);
  return days <= PILOT_SUPPORT_DAYS;
}
