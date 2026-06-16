import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Ouvrir un litige",
  description:
    "Signalez un problème avec votre commande XaalisPay : colis non conforme, non livré. Séquestre Flash et remboursement au Sénégal.",
  path: "/litige",
});

export default function LitigeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
