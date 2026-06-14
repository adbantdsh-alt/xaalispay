import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XaalisPay — Payez les yeux fermés",
  description:
    "Paiement sécurisé pour les achats en ligne au Sénégal. Séquestre, protection client, zéro arnaque.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
