"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/ui/BrandMark";
import { IconMenu, IconX } from "@/components/icons";

const NAV = [
  { href: "/#probleme", label: "Problème" },
  { href: "/#comment", label: "Comment ça marche" },
  { href: "/#demo", label: "Démo" },
  { href: "/#faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/litige", label: "Litige" },
  { href: "/histoire", label: "Notre histoire" },
];

const ANCHOR_IDS = NAV.filter((item) => item.href.startsWith("/#")).map((item) => item.href.slice(2));

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // Scroll-spy : une seule section de la home peut etre "active" a la fois,
  // determinee par celle qui croise le milieu du viewport -- sans ca, isActive()
  // marquait tous les liens d'ancre actifs simultanement dès que pathname === "/".
  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection("");
      return;
    }
    const elements = ANCHOR_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        setActiveSection(visible.length > 0 ? visible[0].target.id : "");
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/" && activeSection === href.slice(2);
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
            Créer un compte
          </Link>
          <button
            type="button"
            className="site-menu-btn"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <IconX size={22} strokeWidth={1.5} /> : <IconMenu size={22} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <div className={`site-mobile-overlay ${menuOpen ? "is-open" : ""}`}>
        <div className="site-mobile-backdrop" onClick={() => setMenuOpen(false)} />
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
          <div className="site-mobile-actions">
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
          </div>
        </nav>
      </div>
    </header>
  );
}
