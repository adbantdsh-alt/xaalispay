import type { Metadata } from "next";
import { getSiteUrl } from "./site-url";

export const SITE_NAME = "XaalisPay";
export const SITE_TAGLINE = "Payez les yeux fermés";
export const SITE_DESCRIPTION =
  "Paiement sécurisé par séquestre pour les achats en ligne au Sénégal. Wave, Orange Money, protection anti-arnaque.";
export const SITE_KEYWORDS = [
  "paiement sécurisé Sénégal",
  "séquestre paiement",
  "achat en ligne Dakar",
  "Wave Orange Money",
  "anti arnaque Instagram",
  "tiers de confiance",
  "XaalisPay",
  "e-commerce Sénégal",
  "paiement mobile money",
  "vendre sur WhatsApp",
];
export const SITE_LOCALE = "fr_SN";
export const SITE_EMAIL = "contact@xaalispay.sn";
export const OG_IMAGE_PATH = "/opengraph-image";

type PageMetaInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
};

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function buildPageMetadata(input: PageMetaInput): Metadata {
  const url = absoluteUrl(input.path ?? "/");
  const title = input.title.includes(SITE_NAME) ? input.title : `${input.title} | ${SITE_NAME}`;
  const image = absoluteUrl(OG_IMAGE_PATH);

  return {
    title,
    description: input.description,
    keywords: input.keywords ?? SITE_KEYWORDS,
    ...(input.noIndex ? {} : { alternates: { canonical: url } }),
    robots: input.noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      type: input.type ?? "website",
      locale: SITE_LOCALE,
      url,
      siteName: SITE_NAME,
      title,
      description: input.description,
      images: [{ url: image, width: 1200, height: 630, alt: `${SITE_NAME} — ${SITE_TAGLINE}` }],
      ...(input.type === "article" && input.publishedTime
        ? { publishedTime: input.publishedTime, modifiedTime: input.modifiedTime, authors: input.authors }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: input.description,
      images: [image],
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: getSiteUrl() }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: `${SITE_NAME} — ${SITE_TAGLINE}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/branding/xaalis-icon.png", type: "image/png", sizes: "512x512" }],
    apple: "/branding/xaalis-icon.png",
    shortcut: "/branding/xaalis-icon.png",
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const PUBLIC_ROUTES = [
  "/",
  "/histoire",
  "/contact",
  "/litige",
  "/cgv",
  "/confidentialite",
  "/mentions-legales",
  "/blog",
] as const;

export const NOINDEX_PREFIXES = [
  "/auth",
  "/dashboard",
  "/wallet",
  "/create",
  "/profile",
  "/settings",
  "/history",
  "/admin",
  "/api",
  "/orderlink",
  "/pay",
] as const;
