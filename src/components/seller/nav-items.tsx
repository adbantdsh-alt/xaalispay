import { Home, Store, Wallet, Settings } from "lucide-react";

export const SELLER_NAV_TABS = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/create", label: "Boutique", icon: Store },
  { href: "/wallet", label: "Portefeuille", icon: Wallet },
  { href: "/settings", label: "Paramètres", icon: Settings },
] as const;

export function isSellerTabActive(pathname: string, href: (typeof SELLER_NAV_TABS)[number]["href"]) {
  return (
    pathname === href ||
    (href === "/create" && pathname.startsWith("/dashboard/products")) ||
    (href === "/settings" && pathname.startsWith("/profile"))
  );
}
