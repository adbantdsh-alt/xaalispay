import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/marketing/Reveal";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Notre histoire — Les fondateurs de XaalisPay",
  description:
    "XaalisPay est né de la rencontre entre le terrain et la tech : Abdoulaye Badji, e-commerçant et CEO, et Insa Diouf, ingénieur et CTO. Leur histoire, et pourquoi la confiance est au cœur de l'e-commerce africain.",
  path: "/histoire",
});

const FOUNDERS = [
  {
    name: "Abdoulaye Badji",
    role: "CEO & co-fondateur",
    facet: "Le terrain",
    photo: "/team/abdoulaye.jpg",
    alt: "Abdoulaye Badji, CEO et co-fondateur de XaalisPay",
    bio: [
      "E-commerçant parti de zéro, sans voiture, sans moto, avec des boostages WhatsApp à 2 dollars. Il a généré des dizaines de millions de FCFA de chiffre d'affaires, et en a perdu autant à cause des commandes fantômes.",
      "Il connaît chaque étape du métier : la négociation, le rendez-vous, le client qui ne répond plus. C'est cette douleur, partagée par tous les e-commerçants africains, qui a donné naissance à XaalisPay.",
    ],
    tags: ["E-commerce", "Terrain", "Vente sur les réseaux"],
    quote: "L'Afrique attend depuis trop longtemps que quelqu'un règle ce problème. Ce quelqu'un, c'était nous.",
  },
  {
    name: "Insa Diouf",
    role: "CTO & co-fondateur",
    facet: "La tech",
    photo: "/team/insa.jpg",
    alt: "Insa Diouf, CTO et co-fondateur de XaalisPay",
    bio: [
      "Ingénieur, entrepreneur et créateur, entre le Sénégal et la France. Il transforme des idées en produits qui marchent vraiment, vite, et lance des produits pensés pour les marchés africains, comme Afrydex Immo et CopyX.",
      "Chez XaalisPay, il porte la vision produit et la tech.",
    ],
    tags: ["Ingénierie", "Vision produit", "Vitesse d'exécution"],
    quote: "C'est l'ère de la jeunesse africaine. Ce n'est pas un slogan. C'est pourquoi je me lève le matin.",
  },
];

const CHAPTERS = [
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

const FINALE_PHOTOS = [
  {
    src: "/team/next/finale-316.jpg",
    alt: "Insa Diouf pitche XaalisPay devant la salle comble de la finale Next Sénégal",
    className: "col-span-2 aspect-[3/2]",
    sizes: "(min-width: 768px) 66vw, 100vw",
  },
  {
    src: "/team/next/finale-310.jpg",
    alt: "Insa Diouf sur scène, micro en main, pendant son pitch",
    className: "row-span-2",
    sizes: "(min-width: 768px) 33vw, 100vw",
  },
  {
    src: "/team/next/finale-308.jpg",
    alt: "Insa Diouf présente XaalisPay au jury de la finale",
    className: "aspect-[3/2]",
    sizes: "(min-width: 768px) 33vw, 100vw",
  },
  {
    src: "/team/next/finale-315.jpg",
    alt: "Le public de la finale Next Sénégal pendant le pitch de XaalisPay",
    className: "aspect-[3/2]",
    sizes: "(min-width: 768px) 33vw, 100vw",
  },
];

export default function HistoirePage() {
  return (
    <article className="bg-white text-[#1E3A5F]">
      {/* ─── Hero ─── */}
      <header className="lp-container pt-14 pb-16 md:pt-20 md:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-12 items-center">
        <Reveal className="lg:col-span-6">
          <span className="lp-pill">Notre histoire</span>
          <h1
            className="mt-6 font-semibold"
            style={{ fontSize: "clamp(2.4rem, 4.8vw, 4.2rem)", lineHeight: 1.02, letterSpacing: "-0.035em" }}
          >
            Deux fondateurs.
            <br />
            <span className="italic font-normal text-[#D4A373]">Une seule obsession : la confiance.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-[17px] md:text-[19px] leading-relaxed text-[#6B7280]">
            XaalisPay est né de la rencontre entre <span className="font-medium text-[#1E3A5F]">le terrain</span> et{" "}
            <span className="font-medium text-[#1E3A5F]">la tech</span> : un e-commerçant qui a vu des dizaines de
            millions s&apos;envoler en commandes fantômes, et un ingénieur qui construit des produits pour les
            marchés africains.
          </p>
        </Reveal>

        <div className="lg:col-span-6 grid grid-cols-2 gap-4 md:gap-6">
          {FOUNDERS.map((f, i) => (
            <Reveal key={f.name} delay={i * 0.1} className={i === 1 ? "mt-10 md:mt-16" : ""}>
              <a href={`#${slug(f.name)}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-[#F7EEE3]">
                  <Image
                    src={f.photo}
                    alt={f.alt}
                    fill
                    priority
                    sizes="(min-width: 768px) 360px, 45vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] md:text-[12px] font-semibold uppercase tracking-wider">
                    {f.facet}
                  </span>
                </div>
                <p className="mt-4 text-[17px] md:text-[20px] font-semibold leading-tight">{f.name}</p>
                <p className="mt-1 text-[13px] md:text-[14px] text-[#B8895D] font-medium">{f.role}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </header>

      {/* ─── Les fondateurs ─── */}
      <section className="lp-surface-gray py-20 md:py-28">
        <div className="lp-container">
          <Reveal className="max-w-3xl">
            <div className="lp-eyebrow">Les fondateurs</div>
            <h2 className="lp-h2 mt-5 !text-[36px] md:!text-[52px] leading-[1.05]">
              Le terrain et la tech, à la même table.
            </h2>
          </Reveal>

          <div className="mt-16 space-y-20 md:space-y-28">
            {FOUNDERS.map((f, i) => (
              <Reveal
                key={f.name}
                className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center scroll-mt-28"
              >
                <div id={slug(f.name)} className={`lg:col-span-5 ${i % 2 ? "lg:order-2" : ""}`}>
                  <div className="relative mx-auto aspect-[4/5] w-full max-w-[440px] overflow-hidden rounded-[32px] bg-[#F7EEE3]">
                    <Image src={f.photo} alt={f.alt} fill sizes="(min-width: 1024px) 440px, 90vw" className="object-cover" />
                  </div>
                </div>
                <div className={`lg:col-span-7 ${i % 2 ? "lg:order-1" : ""}`}>
                  <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#B8895D]">
                    0{i + 1} · {f.facet}
                  </p>
                  <h3 className="mt-3 text-[32px] md:text-[44px] font-semibold leading-[1.05] tracking-tight">
                    {f.name}
                  </h3>
                  <p className="mt-2 text-[16px] font-medium text-[#6B7280]">{f.role}</p>
                  <div className="mt-7 space-y-4 text-[16px] md:text-[17px] leading-relaxed text-[#1E3A5F]/80">
                    {f.bio.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                  <ul className="mt-7 flex flex-wrap gap-2">
                    {f.tags.map((t) => (
                      <li key={t} className="rounded-full lp-hairline bg-white px-3.5 py-1.5 text-[13px] font-medium">
                        {t}
                      </li>
                    ))}
                  </ul>
                  <blockquote className="mt-9 border-l-2 border-[#D4A373] pl-5 text-[19px] md:text-[22px] italic leading-[1.4]">
                    « {f.quote} »
                  </blockquote>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Mot du CEO ─── */}
      <section className="py-20 md:py-28">
        <div className="lp-container grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <div className="lp-eyebrow">Mot du CEO</div>
              <h2 className="mt-5 text-[32px] md:text-[42px] font-semibold leading-[1.08] tracking-tight">
                Comment tout a commencé.
              </h2>
              <div className="mt-8 flex items-center gap-3">
                <span className="relative h-12 w-12 overflow-hidden rounded-full bg-[#F7EEE3]">
                  <Image src="/team/abdoulaye.jpg" alt="" fill sizes="48px" className="object-cover" />
                </span>
                <span className="leading-tight">
                  <span className="block text-[15px] font-semibold">Abdoulaye Badji</span>
                  <span className="block text-[13px] text-[#6B7280]">CEO & co-fondateur</span>
                </span>
              </div>
            </div>
          </aside>

          <ol className="lg:col-span-8 space-y-14 md:space-y-16">
            {CHAPTERS.map((c, i) => (
              <Reveal as="li" key={c.heading} className="border-t border-[#1E3A5F]/10 pt-8">
                <span className="font-mono text-[13px] text-[#B8895D]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-[24px] md:text-[30px] font-semibold leading-[1.15] tracking-tight">
                  {c.heading}
                </h3>
                <div className="mt-5 space-y-4 text-[16px] md:text-[17px] leading-[1.75] text-[#1E3A5F]/80">
                  {c.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── Finale Next Sénégal ─── */}
      <section className="lp-surface-navy py-20 md:py-28">
        <div className="lp-container">
          <Reveal className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end">
            <div className="lg:col-span-7">
              <span className="lp-pill lp-pill-dark">Concours Next Sénégal · Finaliste</span>
              <h2
                className="mt-6 text-white font-semibold"
                style={{ fontSize: "clamp(2rem, 4.4vw, 3.4rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}
              >
                XaalisPay sur la scène{" "}
                <span className="italic font-normal text-[#D4A373]">de la finale.</span>
              </h2>
            </div>
            <p className="lg:col-span-5 text-[16px] md:text-[17px] leading-relaxed text-white/70">
              Insa a porté XaalisPay jusqu&apos;en finale du concours de pitch Next Sénégal, face au jury et à une
              salle pleine. Une étape de plus pour faire de la confiance le standard de l&apos;e-commerce africain.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {FINALE_PHOTOS.map((p) => (
              <Reveal key={p.src} className={`relative overflow-hidden rounded-[24px] bg-white/5 ${p.className}`}>
                <Image src={p.src} alt={p.alt} fill sizes={p.sizes} className="object-cover" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Fin ─── */}
      <section className="py-20 md:py-28">
        <Reveal className="lp-container max-w-4xl text-center">
          <p
            className="font-semibold"
            style={{ fontSize: "clamp(1.9rem, 4.2vw, 3.2rem)", lineHeight: 1.12, letterSpacing: "-0.025em" }}
          >
            « L&apos;arnaque s&apos;arrête là où{" "}
            <span className="italic font-normal text-[#D4A373]">XaalisPay pose le pied.</span>{"\u00a0»"}
          </p>
          <p className="mt-4 text-[14px] text-[#6B7280]">Abdoulaye Badji & Insa Diouf, co-fondateurs</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/auth?mode=signup" className="lp-btn lp-btn-primary">
              Rejoindre XaalisPay
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full border border-[#1E3A5F]/20 px-5 py-3 text-[14px] font-semibold hover:bg-[#1E3A5F]/5 transition-colors"
            >
              Nous contacter
            </Link>
          </div>
        </Reveal>
      </section>
    </article>
  );
}

function slug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}
