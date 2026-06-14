import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfileByUsername, getProductsBySeller } from "@/lib/orders";
import { SellerShopClient } from "@/components/shop/SellerShopClient";
import { BrandMark } from "@/components/ui/BrandMark";

const RESERVED = [
  "auth", "dashboard", "wallet", "create", "profile", "pay", "api",
  "seller", "orderlink", "home", "histoire", "contact", "cgv",
  "confidentialite", "mentions-legales",
];

export default async function SellerPublicPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  if (RESERVED.includes(username.toLowerCase())) redirect("/");

  const profile = getProfileByUsername(username);
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

  const products = getProductsBySeller(profile.id, true);
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
        username={profile.username}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          deliveryCost: p.deliveryCost || 0,
          image: p.image,
        }))}
      />
    </div>
  );
}
