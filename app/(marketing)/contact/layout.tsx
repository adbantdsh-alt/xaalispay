import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — XaalisPay",
  description: "Contactez l'équipe XaalisPay pour le support, les litiges ou l'ouverture de boutique.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
