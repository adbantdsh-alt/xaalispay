import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Mentions légales",
  description:
    "Mentions légales XaalisPay : éditeur, hébergement, contact et informations juridiques au Sénégal.",
  path: "/mentions-legales",
});

export default function MentionsLegalesPage() {
  return (
    <article className="content-page legal-page">
      <header className="content-hero">
        <p className="section-label">Légal</p>
        <h1 className="content-title">Mentions légales</h1>
      </header>

      <div className="glass-card legal-body">
        <section>
          <h2>Éditeur</h2>
          <p>
            XaalisPay est une marque de Adba Ecom X LLC.
            <br />
            1209 Mountain Road PL NE, STE R, Albuquerque, NM 87110, USA
          </p>
          <p>
            Présence opérationnelle : Dakar, Sénégal
            <br />
            Email :{" "}
            <a href="mailto:contact@xaalispay.sn" className="content-link">
              contact@xaalispay.sn
            </a>
          </p>
        </section>

        <section>
          <h2>Hébergement</h2>
          <p>
            Application hébergée conformément aux standards de sécurité en vigueur. Les détails
            d&apos;hébergement peuvent être communiqués sur demande.
          </p>
        </section>

        <section>
          <h2>Propriété intellectuelle</h2>
          <p>
            La marque XaalisPay, son interface et ses contenus sont protégés. Toute reproduction
            non autorisée est interdite.
          </p>
        </section>

        <section>
          <h2>Droit applicable</h2>
          <p>
            Les présentes mentions sont régies par le droit sénégalais. En cas de litige, les
            tribunaux compétents de Dakar seront saisis, après tentative de résolution amiable.
          </p>
        </section>
      </div>
    </article>
  );
}
