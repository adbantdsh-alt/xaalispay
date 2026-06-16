import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Connexion vendeur",
  description: "Connectez-vous ou créez votre boutique XaalisPay pour vendre en sécurité au Sénégal.",
  path: "/auth",
  noIndex: true,
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
