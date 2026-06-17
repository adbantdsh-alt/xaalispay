"use client";

import { AtSign } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";
import { VendorSearch } from "@/components/marketing/VendorSearch";

export function LandingXaalisTagSearch() {
  return (
    <section className="lp-xaalis-search" id="acheteurs" aria-labelledby="lp-xaalis-search-title">
      <div className="lp-container">
        <Reveal className="lp-xaalis-search-card">
          <div className="lp-xaalis-search-head">
            <p className="lp-kicker">Payer un vendeur</p>
            <h2 id="lp-xaalis-search-title" className="lp-h2 serif">
              Recherchez un XaalisTag
            </h2>
            <p className="lp-xaalis-search-desc">
              Entrez le @pseudo reçu sur WhatsApp ou Instagram, choisissez un produit et payez
              en séquestre — Wave ou Orange Money.
            </p>
          </div>
          <div className="lp-xaalis-search-field">
            <span className="lp-xaalis-search-hint">
              <AtSign size={15} strokeWidth={1.75} aria-hidden="true" />
              Exemple : <strong>@adba</strong> ou le nom de la boutique
            </span>
            <VendorSearch large />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
