import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "FAQ — Toutes les réponses sur XaalisPay",
  description:
    "Paiement bloqué, litige, remboursement, sécurité : toutes les réponses aux questions fréquentes sur XaalisPay.",
  path: "/faq",
});

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
