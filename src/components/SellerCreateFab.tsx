"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SellerCreateFab() {
  const pathname = usePathname();
  if (pathname === "/create") return null;

  return (
    <Link href="/create" className="seller-fab">
      <span aria-hidden="true">+</span>
      Ajouter un produit
    </Link>
  );
}
