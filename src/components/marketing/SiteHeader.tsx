"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";

const NAV = [
  { href: "/#acheteurs", label: "Acheteurs" },
  { href: "/#vendeurs", label: "Vendeurs" },
  { href: "/#faq", label: "Tarifs" },
  { href: "/litige", label: "Litige" },
  { href: "/histoire", label: "Notre histoire" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/";
    return pathname === href;
  };

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
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
            Créer un compte
          </Link>
          <button
            type="button"
            className="site-menu-btn"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
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
            Créer un compte
          </Link>
        </nav>
      )}
    </header>
  );
}
