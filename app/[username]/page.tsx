import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfileByUsername, getProductsBySeller } from "@/lib/orders";
import { formatDeliveryHours } from "@/lib/utils";
import { SellerShopClient } from "./SellerShopClient";

export default async function SellerPublicPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const reserved = ["auth", "dashboard", "pay", "api"];
  if (reserved.includes(username.toLowerCase())) {
    redirect("/");
  }

  const profile = getProfileByUsername(username);
  if (!profile) {
    return (
      <div className="page-shell flex min-h-dvh items-center justify-center">
        <div className="card p-8 text-center">
          <p className="text-4xl">🔍</p>
          <h1 className="mt-3 text-xl font-bold">Vendeur introuvable</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Aucun vendeur avec l&apos;identifiant @{username}
          </p>
          <Link href="/" className="btn-primary mt-6 inline-flex">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  const products = getProductsBySeller(profile.id, true);

  return (
    <div className="page-shell">
      <header className="mb-5">
        <Link href="/" className="text-sm font-semibold text-[var(--muted)]">
          ← XaalisPay
        </Link>
        <div className="card mt-4 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F1F66] to-[#0FD5C7] text-xl font-bold text-white">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold">{profile.displayName}</h1>
              <p className="text-sm text-[var(--muted)]">@{profile.username}</p>
              {profile.businessName && (
                <p className="mt-1 text-sm">{profile.businessName}</p>
              )}
              <span className="badge badge-verified mt-2">✓ Vendeur vérifié</span>
            </div>
          </div>
        </div>
      </header>

      <SellerShopClient
        username={profile.username}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          deliveryHours: p.deliveryHours,
          deliveryLabel: formatDeliveryHours(p.deliveryHours),
          image: p.image,
        }))}
      />
    </div>
  );
}
