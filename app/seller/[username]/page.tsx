import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfileByUsername, getProductsBySeller } from "@/lib/orders";
import { resolveProductImageUrl } from "@/lib/product-images";
import { SellerShopClient } from "@/components/shop/SellerShopClient";
import { BrandMark } from "@/components/ui/BrandMark";
import { buildPageMetadata } from "@/lib/seo";

const RESERVED_REDIRECTS: Record<string, string> = {
  admin: "/admin",
  auth: "/auth",
  dashboard: "/dashboard",
  wallet: "/wallet",
  create: "/create",
  profile: "/profile",
  history: "/history",
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

  const profile = await getProfileByUsername(username);
  if (!profile) {
    return buildPageMetadata({
      title: "Vendeur introuvable",
      description: "Cette boutique XaalisPay n'existe pas.",
      path: `/seller/${username}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: `Boutique ${profile.displayName} (@${profile.username})`,
    description: `Achetez en sécurité chez ${profile.displayName} sur XaalisPay. Paiement séquestre Wave et Orange Money au Sénégal.`,
    path: `/seller/${username}`,
    keywords: [profile.displayName, profile.username, "boutique XaalisPay", "achat sécurisé Sénégal"],
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

  const profile = await getProfileByUsername(username);
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

  const products = await getProductsBySeller(profile.id, true);
  const initial = profile.displayName.charAt(0).toUpperCase();

  return (
    <div className="page-shell" style={{ padding: "0 1.25rem 2rem" }}>
      <header className="pay-brand-bar" style={{ padding: "1rem 0" }}>
        <BrandMark size="sm" />
        <span className="pay-secure-pill">Boutique</span>
      </header>

      <div className="pay-vendor-row animate-fade-up">
        <div className="pay-vendor-avatar">{initial}</div>
        <div>
          <p className="pay-vendor-name">{profile.displayName}</p>
          <p className="pay-vendor-meta">@{profile.username} · Vendeur vérifié</p>
        </div>
      </div>

      <SellerShopClient
        products={products.map((p) => ({
          id: p.id,
          paymentSlug: p.paymentSlug,
          name: p.name,
          price: p.price,
          deliveryCost: p.deliveryCost || 0,
          image: resolveProductImageUrl(p.image),
        }))}
      />
    </div>
  );
}
