import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { AdminShellClient } from "@/components/admin/AdminShellClient";

export const metadata: Metadata = buildPageMetadata({
  title: "Administration",
  description: "Console d'administration XaalisPay.",
  noIndex: true,
});

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return <AdminShellClient>{children}</AdminShellClient>;
}
