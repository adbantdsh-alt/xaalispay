"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/connect", label: "Vue d'ensemble" },
  { href: "/admin/connect/analytics", label: "Analytics" },
  { href: "/admin/connect/platforms", label: "Plateformes" },
] as const;

export default function AdminConnectLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <nav className="admin-local-tabs" aria-label="Sections Connect">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`admin-filter${pathname === tab.href ? " is-active" : ""}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
