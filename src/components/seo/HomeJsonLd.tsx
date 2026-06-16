import { JsonLd } from "@/components/seo/JsonLd";
import { LANDING_FAQ } from "@/lib/faq";
import { absoluteUrl, SITE_DESCRIPTION, SITE_EMAIL, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export function HomeJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/branding/xaalis-logo.png"),
    description: SITE_DESCRIPTION,
    email: SITE_EMAIL,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dakar",
      addressCountry: "SN",
    },
    areaServed: { "@type": "Country", name: "Sénégal" },
    sameAs: [],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    inLanguage: "fr-SN",
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: LANDING_FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const product = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    slogan: SITE_TAGLINE,
    provider: { "@type": "Organization", name: SITE_NAME },
    areaServed: "SN",
  };

  return <JsonLd data={[organization, website, faqPage, product]} />;
}
