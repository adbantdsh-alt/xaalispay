import type { Metadata } from "next";
import Link from "next/link";
import { getAllBlogPosts } from "@/content/blog/posts";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Blog — Conseils paiement sécurisé au Sénégal",
  description:
    "Guides, astuces anti-arnaque et actualités XaalisPay pour acheteurs et vendeurs du Sénégal.",
  path: "/blog",
  keywords: [
    "blog paiement Sénégal",
    "arnaque Instagram",
    "séquestre mobile money",
    "vendre en ligne Dakar",
  ],
});

const CATEGORY_COLORS: Record<string, string> = {
  Acheteurs: "blog-cat-buyers",
  Vendeurs: "blog-cat-sellers",
  Sécurité: "blog-cat-security",
  Guides: "blog-cat-guides",
};

export default function BlogPage() {
  const posts = getAllBlogPosts();

  return (
    <article className="content-page blog-index">
      <header className="content-hero">
        <p className="section-label">Blog XaalisPay</p>
        <h1 className="content-title serif">
          Acheter et vendre en sécurité
          <br />
          au Sénégal
        </h1>
        <p className="content-lead">
          Guides pratiques, conseils anti-arnaque et bonnes pratiques pour le commerce en ligne
          avec Wave, Orange Money et séquestre.
        </p>
      </header>

      <div className="blog-grid">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card glass-card">
            <span className={`blog-card-cat ${CATEGORY_COLORS[post.category] ?? ""}`}>
              {post.category}
            </span>
            <h2 className="blog-card-title">{post.title}</h2>
            <p className="blog-card-desc">{post.description}</p>
            <div className="blog-card-meta">
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString("fr-SN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
              <span>·</span>
              <span>{post.readingTime} min de lecture</span>
            </div>
          </Link>
        ))}
      </div>
    </article>
  );
}
