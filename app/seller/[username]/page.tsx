import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getApiBaseUrl } from "@/lib/site-url";
import { SellerShopClient } from "@/components/shop/SellerShopClient";
import { BrandMark } from "@/components/ui/BrandMark";
import { buildPageMetadata } from "@/lib/seo";

interface PublicProfile {
  username: string;
  display_name: string;
  business_name: string;
  phone?: string;
}

interface PublicProduct {
  payment_slug: string;
  name: string;
  price: number;
  delivery_cost: number;
  image: string | null;
}

async function fetchPublicProfile(username: string): Promise<PublicProfile | null> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/public/${encodeURIComponent(username)}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchSellerProducts(username: string): Promise<PublicProduct[]> {
  const res = await fetch(
    `${getApiBaseUrl()}/api/catalog/public/sellers/${encodeURIComponent(username)}/products`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json();
}

const RESERVED_REDIRECTS: Record<string, string> = {
  admin: "/admin",
  auth: "/auth",
  dashboard: "/dashboard",
  wallet: "/wallet",
  create: "/create",
  profile: "/profile",
  history: "/dashboard",
  settings: "/settings",
  blog: "/blog",
  litige: "/litige",
  contact: "/contact",
  histoire: "/histoire",
  cgv: "/cgv",
  confidentialite: "/confidentialite",
  "mentions-legales": "/mentions-legales",
  home: "/",
};

const RESERVED = [
  ...Object.keys(RESERVED_REDIRECTS),
  "auth", "dashboard", "wallet", "create", "profile", "pay", "api",
  "seller", "orderlink", "home", "histoire", "contact", "cgv",
  "confidentialite", "mentions-legales", "blog", "litige", "admin",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  if (RESERVED.includes(username.toLowerCase())) return {};

  const profile = await fetchPublicProfile(username);
  if (!profile) {
    return buildPageMetadata({
      title: "Vendeur introuvable",
      description: "Cette boutique XaalisPay n'existe pas.",
      path: `/seller/${username}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: `Boutique ${profile.display_name} (@${profile.username})`,
    description: `Achetez en sécurité chez ${profile.display_name} sur XaalisPay. Paiement séquestre Wave et Orange Money au Sénégal.`,
    path: `/seller/${username}`,
    keywords: [profile.display_name, profile.username, "boutique XaalisPay", "achat sécurisé Sénégal"],
  });
}

export default async function SellerPublicPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const reservedKey = username.toLowerCase();
  if (RESERVED.includes(reservedKey)) {
    redirect(RESERVED_REDIRECTS[reservedKey] ?? "/");
  }

  const profile = await fetchPublicProfile(username);
  if (!profile) {
    return (
      <div className="page-shell status-screen">
        <h1 className="status-screen-title">Vendeur introuvable</h1>
        <Link href="/" className="btn-primary" style={{ marginTop: "1.5rem", width: "auto", padding: "0 2rem" }}>
          Accueil
        </Link>
      </div>
    );
  }

  const products = await fetchSellerProducts(username);
  const initial = profile.display_name.charAt(0).toUpperCase();

  return (
    <div className="page-shell" style={{ padding: "0 1.25rem 2rem" }}>
      <header className="pay-brand-bar" style={{ padding: "1rem 0" }}>
        <BrandMark size="sm" />
        <span className="pay-secure-pill">Boutique</span>
      </header>

      <div className="pay-vendor-row animate-fade-up">
        <div className="pay-vendor-avatar">{initial}</div>
        <div>
          <p className="pay-vendor-name">{profile.display_name}</p>
          <p className="pay-vendor-meta">@{profile.username} · Vendeur vérifié</p>
        </div>
      </div>

      <SellerShopClient
        products={products.map((p) => ({
          id: p.payment_slug,
          paymentSlug: p.payment_slug,
          name: p.name,
          price: p.price,
          deliveryCost: p.delivery_cost || 0,
          image: p.image || "",
        }))}
      />
    </div>
  );
}
