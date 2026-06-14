"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Accueil", icon: "home" },
  { href: "/create", label: "Boutique", icon: "shop" },
  { href: "/profile", label: "Profil", icon: "user" },
] as const;

function TabIcon({ type }: { type: (typeof TABS)[number]["icon"] }) {
  if (type === "home") {
    return (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    );
  }
  if (type === "shop") {
    return (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="floating-nav-wrap">
      <nav className="floating-nav" aria-label="Navigation vendeur">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href === "/create" && pathname.startsWith("/dashboard/products")) ||
            (tab.href === "/dashboard" && pathname === "/wallet");

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`floating-nav-item ${active ? "floating-nav-item-active" : ""}`}
            >
              <TabIcon type={tab.icon} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
