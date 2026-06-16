import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllBlogPosts, getBlogPost, getBlogSlugs } from "@/content/blog/posts";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, buildPageMetadata, SITE_NAME } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return buildPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    authors: [SITE_NAME],
    keywords: [post.category, "XaalisPay", "Sénégal", "paiement sécurisé"],
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const related = getAllBlogPosts()
    .filter((p) => p.slug !== slug && p.category === post.category)
    .slice(0, 2);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/branding/xaalis-logo.png") },
    },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    inLanguage: "fr-SN",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
      { "@type": "ListItem", position: 3, name: post.title, item: absoluteUrl(`/blog/${post.slug}`) },
    ],
  };

  return (
    <>
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd]} />
      <article className="content-page blog-article">
        <header className="content-hero">
          <Link href="/blog" className="blog-back-link">
            ← Retour au blog
          </Link>
          <p className="section-label">{post.category}</p>
          <h1 className="content-title serif">{post.title}</h1>
          <p className="content-lead">{post.description}</p>
          <div className="blog-article-meta">
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
        </header>

        <div className="blog-article-body glass-card">
          {post.sections.map((section, i) => {
            if (section.type === "h2") {
              return (
                <h2 key={i} className="blog-h2">
                  {section.text}
                </h2>
              );
            }
            if (section.type === "ul") {
              return (
                <ul key={i} className="blog-ul">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="blog-p">
                {section.text}
              </p>
            );
          })}
        </div>

        <aside className="blog-cta glass-card">
          <h2 className="blog-cta-title">Prêt à payer les yeux fermés ?</h2>
          <p className="blog-cta-text">
            Achetez en sécurité ou créez votre boutique vendeur gratuitement sur XaalisPay.
          </p>
          <div className="blog-cta-actions">
            <Link href="/" className="btn-relief-blue">
              Découvrir XaalisPay
            </Link>
            <Link href="/auth?mode=signup" className="blog-cta-secondary">
              Créer un compte vendeur
            </Link>
          </div>
        </aside>

        {related.length > 0 && (
          <section className="blog-related">
            <h2 className="blog-related-title">Articles similaires</h2>
            <div className="blog-related-grid">
              {related.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}`} className="blog-related-card">
                  <p className="blog-related-cat">{r.category}</p>
                  <p className="blog-related-name">{r.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
