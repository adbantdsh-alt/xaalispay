import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";
import { IconUser } from "@/components/icons";

export const metadata: Metadata = buildPageMetadata({
  title: "Mot du Co-fondateur — Notre histoire",
  description:
    "L'histoire de XaalisPay, racontée par Mr Abdoulaye Badji, son co-fondateur. Du boostage WhatsApp aux dizaines de millions de chiffre d'affaires, et la naissance d'un tiers de confiance pour l'e-commerce africain.",
  path: "/histoire",
});

const SECTIONS = [
  {
    heading: "Tout a commencé avec un boostage WhatsApp à 2 dollars",
    body: [
      "J'ai démarré l'e-commerce de zéro. Pas de voiture, pas de moto, même pas de vélo. Mes premiers clients, je les ai eus grâce à des boostages WhatsApp à 2 ou 3 dollars. On discutait, on négociait, on convenait d'un lieu de livraison. Et je prenais le bus pour m'y rendre.",
      "Sauf que trois fois sur cinq — parfois quatre fois sur cinq — le client n'était pas au rendez-vous. Ou il ne répondait plus une fois sur place. Ou il annulait en cours de route. Jamais pour une raison valable : « j'ai un enterrement », « j'ai une urgence », « je te rappelle la semaine prochaine ».",
      "Quand on débute, ça fait très mal au cœur. Tu y as cru, tu as pris ton bus, tu as donné ton temps — et le client disparaît.",
    ],
  },
  {
    heading: "La moitié de notre chiffre d'affaires n'existait pas",
    body: [
      "J'ai généré des dizaines de millions de FCFA de chiffre d'affaires sur le marché africain. Et j'en ai perdu également des dizaines de millions — à cause de commandes non honorées et de clients oiseaux.",
      "Quand on a commencé à comptabiliser les commandes annulées par jour, on s'est rendu compte d'une chose brutale : ce chiffre d'affaires fictif faisait souvent deux fois le chiffre d'affaires réellement encaissé. De l'argent qu'on n'a jamais vu. Des heures, des trajets, des espoirs perdus.",
      "Et cette douleur, je sais qu'elle est partagée par tous les e-commerçants africains. De Dakar à Lomé, d'Abidjan à Bamako.",
    ],
  },
  {
    heading: "Le problème : un manque de tiers de confiance",
    body: [
      "En Afrique, les processeurs de paiement existent déjà : Wave, Orange Money, Free Money. La technologie est là. Ce qui manque, ce n'est pas un moyen de paiement de plus — c'est un tiers de confiance.",
      "Un acteur neutre qui garde l'argent jusqu'à ce que la livraison soit faite et validée. Un acteur qui rassure l'acheteur, protège le vendeur, et rend l'arnaque tout simplement impossible.",
    ],
  },
  {
    heading: "Pourquoi nous",
    body: [
      "L'Afrique est un continent qui attend trop souvent que quelqu'un règle ses problèmes à sa place. « Un jour, quelqu'un fera ça. » Mais ici, ce quelqu'un, c'était nous.",
      "Nous, les acteurs qui ont galéré dans ce métier. Parce que oui, l'e-commerce est un vrai métier. Nous sommes les seuls à connaître la réalité du terrain, et donc les seuls capables de la changer.",
    ],
  },
  {
    heading: "Plus qu'un outil de paiement, un outil de confiance",
    body: [
      "Nous avons créé XaalisPay pour honorer ce métier et lui rendre le respect qu'il mérite. Pour que demain, nos petits frères, nos petites sœurs, nos mères, nos tantes n'aient plus à galérer comme nous l'avons fait.",
      "Pour donner un nouveau souffle à l'e-commerce africain.",
      "Parce que XaalisPay n'est pas qu'un outil de paiement — c'est un outil de confiance. Et la confiance n'a pas de prix. Une fois brisée, elle ne se restaure jamais. La confiance des Africains dans l'e-commerce était quasi inexistante. Ça, c'était avant XaalisPay.",
    ],
  },
];

export default function HistoirePage() {
  return (
    <article className="content-page">
      <header className="content-hero">
        <p className="section-label">Mot du co-fondateur</p>
        <h1 className="content-title">Mr Abdoulaye Badji</h1>
        <p className="content-lead">
          L&apos;histoire de XaalisPay, racontée par son co-fondateur — e-commerçant et acteur du
          terrain africain.
        </p>
      </header>

      <div className="content-timeline">
        <div className="lp-card-flat content-chapter">
          <div className="rounded-2xl overflow-hidden bg-[#0B1B33] aspect-[4/5] max-w-md flex items-center justify-center">
            <IconUser size={96} className="text-white/20" />
          </div>
          <blockquote className="mt-6 text-[18px] md:text-[20px] text-[#1E3A5F] leading-[1.4]">
            « L&apos;Afrique attend depuis trop longtemps que quelqu&apos;un règle ce problème. Ce
            quelqu&apos;un, c&apos;était nous. »
          </blockquote>
        </div>

        {SECTIONS.map((section) => (
          <section key={section.heading} className="lp-card-flat content-chapter">
            <h2 className="content-chapter-title text-[22px] md:text-[26px] font-medium">{section.heading}</h2>
            {section.body.map((p, i) => (
              <p key={i} className="content-chapter-body" style={{ whiteSpace: "normal" }}>
                {p}
              </p>
            ))}
          </section>
        ))}

        <div className="lp-surface-navy content-chapter">
          <p className="text-white text-[20px] md:text-[26px] leading-[1.35]">
            « L&apos;arnaque s&apos;arrête là où XaalisPay pose le pied. »
          </p>
          <div className="mt-3 text-white/60 text-[13px]">— Mr Abdoulaye Badji, co-fondateur</div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/auth?mode=signup" className="lp-btn lp-btn-primary">
              Rejoindre XaalisPay
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center px-5 py-3 rounded-full border border-white/25 lp-text-white text-[14px] font-semibold hover:bg-white/10 transition-colors"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
