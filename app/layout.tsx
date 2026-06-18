import { Instrument_Serif, Inter_Tight } from "next/font/google";
import "./globals.css";
import { rootMetadata } from "@/lib/seo";
import { AuthProvider } from "@/lib/auth-client";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-serif",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body
        className={`app-bg ${interTight.className} ${instrumentSerif.variable} ${interTight.variable}`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
