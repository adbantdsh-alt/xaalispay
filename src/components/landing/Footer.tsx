"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";

const COLS = [
  {
    title: "Produit",
    links: [
      { label: "Comment ça marche", href: "/#comment" },
      { label: "FAQ", href: "/#faq" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Acheteurs",
    links: [
      { label: "Le séquestre", href: "/#comment" },
      { label: "Ouvrir un litige", href: "/litige" },
    ],
  },
  {
    title: "Vendeurs",
    links: [
      { label: "Créer un compte", href: "/auth?mode=signup" },
      { label: "Se connecter", href: "/auth" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { label: "Notre histoire", href: "/histoire" },
      { label: "Nous contacter", href: "/contact" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Conditions générales", href: "/cgv" },
      { label: "Confidentialité", href: "/confidentialite" },
      { label: "Mentions légales", href: "/mentions-legales" },
    ],
  },
];

const PAYMENTS = ["Wave", "Orange Money", "Free Money", "Visa"];

export function Footer() {
  const [sent, setSent] = useState(false);

  const onNewsletter = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <footer className="ln-footer">
      <div className="ln-container">
        <div className="ln-footer-top">
          <p className="ln-footer-wordmark serif">
            Xaalis<b>Pay</b>
          </p>
          <form className="ln-footer-newsletter" onSubmit={onNewsletter}>
            <label htmlFor="ln-newsletter" className="ln-footer-newsletter-label">
              Restez informé
            </label>
            <div className="ln-footer-newsletter-row">
              <input
                id="ln-newsletter"
                type="email"
                placeholder="Votre email"
                required
                className="ln-footer-newsletter-input"
              />
              <button type="submit" className="ln-footer-newsletter-btn" aria-label="S'inscrire">
                <ArrowRight size={18} strokeWidth={1.25} />
              </button>
            </div>
            {sent && <p className="ln-footer-newsletter-sent">Merci — nous vous tiendrons informé.</p>}
          </form>
        </div>

        <div className="ln-footer-cols">
          {COLS.map((col) => (
            <div key={col.title} className="ln-footer-col">
              <p className="ln-footer-col-title">{col.title}</p>
              {col.links.map((link) => (
                <Link key={link.label} href={link.href} className="ln-footer-link">
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="ln-footer-bottom">
          <p>© 2026 XaalisPay · Dakar, Sénégal</p>
          <div className="ln-footer-payments">
            {PAYMENTS.map((name) => (
              <span key={name} className="ln-footer-payment">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
