import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

export const metadata: Metadata = buildPageMetadata({
  title: "Paiement sécurisé",
  description: "Page de paiement XaalisPay.",
  noIndex: true,
});

export default function OrderlinkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineBanner />
      {children}
    </>
  );
}
