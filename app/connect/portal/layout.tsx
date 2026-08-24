import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { PortalAuthProvider } from "@/lib/connect-portal-auth";

export const metadata: Metadata = buildPageMetadata({
  title: "Portail Connect",
  description: "Portail self-serve des plateformes intégrées à XaalisPay Connect.",
  noIndex: true,
});

export default function ConnectPortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalAuthProvider>{children}</PortalAuthProvider>;
}
