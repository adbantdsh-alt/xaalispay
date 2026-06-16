import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Page introuvable",
  description: "La page demandée n'existe pas sur XaalisPay.",
  noIndex: true,
});

export default function NotFound() {
  return (
    <div className="page-shell status-screen">
      <p className="section-label">404</p>
      <h1 className="status-screen-title">Page introuvable</h1>
      <p className="status-screen-desc">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <div className="not-found-links">
        <Link href="/" className="btn-primary">
          Accueil
        </Link>
        <Link href="/blog" className="btn-secondary">
          Blog
        </Link>
        <Link href="/contact" className="btn-secondary">
          Contact
        </Link>
      </div>
    </div>
  );
}
