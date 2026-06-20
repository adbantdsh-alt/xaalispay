import { Rubik, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { rootMetadata } from "@/lib/seo";
import { AuthProvider } from "@/lib/auth-client";

const rubik = Rubik({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: "500",
  variable: "--font-mono",
});

export const metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body
        className={`app-bg ${rubik.className} ${rubik.variable} ${jetBrainsMono.variable}`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
