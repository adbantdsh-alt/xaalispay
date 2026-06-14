const DEFAULT_SITE_URL = "https://xaalispay.com";

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return DEFAULT_SITE_URL;
}

export function buildShopPath(username: string): string {
  return `/seller/${username}`;
}

export function buildShopUrl(username: string): string {
  return `${getSiteUrl()}${buildShopPath(username)}`;
}

export function buildPaymentLinkPath(slug: string): string {
  return `/orderlink/${slug}`;
}

export function buildPaymentLinkUrl(slug: string): string {
  return `${getSiteUrl()}${buildPaymentLinkPath(slug)}`;
}

export function formatPublicUrl(url: string): string {
  return url.replace(/^https?:\/\//, "");
}
