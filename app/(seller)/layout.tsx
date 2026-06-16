import type { Metadata } from "next";
import { SellerAppShell } from "@/components/SellerAppShell";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Espace vendeur",
  description: "Tableau de bord vendeur XaalisPay.",
  noIndex: true,
});

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SellerAppShell>{children}</SellerAppShell>;
}
