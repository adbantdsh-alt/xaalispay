"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/ui/BrandMark";
import { IconMenu, IconClose } from "@/components/ui/AppIcon";

const NAV = [
  { href: "/#acheteurs", label: "Acheteurs" },
  { href: "/#vendeurs", label: "Vendeurs" },
  { href: "/histoire", label: "Notre histoire" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/";
    return pathname === href;
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <BrandMark size="sm" />

        <nav className="site-nav" aria-label="Navigation principale">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`site-nav-link ${isActive(item.href) ? "site-nav-link-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-header-actions">
          <Link href="/auth" className="site-header-ghost">
            Connexion
          </Link>
          <Link href="/auth?mode=signup" className="site-header-cta">
            Créer ma boutique
          </Link>
          <button
            type="button"
            className="site-menu-btn"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <IconClose size={22} /> : <IconMenu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="site-mobile-nav" aria-label="Navigation mobile">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`site-mobile-link ${isActive(item.href) ? "site-mobile-link-active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/auth" className="site-mobile-link" onClick={() => setMenuOpen(false)}>
            Connexion
          </Link>
          <Link
            href="/auth?mode=signup"
            className="site-mobile-link site-mobile-link-cta"
            onClick={() => setMenuOpen(false)}
          >
            Créer ma boutique
          </Link>
        </nav>
      )}
    </header>
  );
}
