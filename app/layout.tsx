import { Plus_Jakarta_Sans } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "XaalisPay — Payez les yeux fermés",
  description:
    "Paiement sécurisé pour les achats en ligne au Sénégal. Séquestre, protection client, zéro arnaque.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`app-bg ${jakarta.className}`}>{children}</body>
    </html>
  );
}
