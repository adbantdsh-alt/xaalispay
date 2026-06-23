"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SELLER_NAV_TABS, isSellerTabActive } from "./seller/nav-items";

export function SellerDesktopTabs() {
  const pathname = usePathname();

  return (
    <nav className="seller-desktop-tabs" aria-label="Navigation vendeur">
      {SELLER_NAV_TABS.map(({ href, label, icon: Icon }) => {
        const active = isSellerTabActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            className={`seller-desktop-tab ${active ? "seller-desktop-tab-active" : ""}`}
          >
            <Icon size={18} strokeWidth={1.5} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
