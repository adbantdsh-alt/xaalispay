"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardNav() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Commandes" },
    { href: "/dashboard/products", label: "Produits" },
  ];

  return (
    <nav className="mb-5 flex gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            pathname === link.href
              ? "bg-[#0F1F66] text-white"
              : "bg-white text-[var(--muted)]"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
