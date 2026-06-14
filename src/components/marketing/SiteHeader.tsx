"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/ui/BrandMark";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/histoire", label: "Notre histoire" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-logo" aria-label="XaalisPay — Accueil">
          <BrandMark />
        </Link>

        <nav className="site-nav" aria-label="Navigation principale">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`site-nav-link ${pathname === item.href ? "site-nav-link-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-header-actions">
          <Link href="/auth" className="site-link-muted">
            Connexion
          </Link>
          <Link href="/auth?mode=signup" className="btn-relief-blue site-cta-btn">
            Espace vendeur
          </Link>
          <button
            type="button"
            className="site-menu-btn"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="site-mobile-nav" aria-label="Navigation mobile">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`site-mobile-link ${pathname === item.href ? "site-mobile-link-active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/auth" className="site-mobile-link" onClick={() => setMenuOpen(false)}>
            Connexion
          </Link>
        </nav>
      )}
    </header>
  );
}
