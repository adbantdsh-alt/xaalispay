"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SELLER_NAV_TABS, isSellerTabActive } from "./seller/nav-items";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="floating-nav-wrap">
      <nav className="floating-nav floating-nav-4" aria-label="Navigation vendeur">
        {SELLER_NAV_TABS.map(({ href, label, icon: Icon }) => {
          const active = isSellerTabActive(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              className={`floating-nav-item ${active ? "floating-nav-item-active" : ""}`}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
