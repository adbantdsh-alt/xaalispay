import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Carrières — Rejoignez XaalisPay",
  description: "Rejoignez XaalisPay et participez à la transformation du paiement en ligne au Sénégal.",
  path: "/carrieres",
});

export default function CarrieresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
