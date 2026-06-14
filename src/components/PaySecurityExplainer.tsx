"use client";

import { useState } from "react";

interface PaySecurityExplainerProps {
  protectionMinutes?: number;
  compact?: boolean;
  collapsible?: boolean;
}

export function PaySecurityExplainer({
  protectionMinutes = 30,
  compact = false,
  collapsible = false,
}: PaySecurityExplainerProps) {
  const [open, setOpen] = useState(true);

  if (compact) {
    return (
      <div className="glass-card p-4 text-left">
        <p className="text-xs font-bold text-black">Vous gardez le contrôle</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Votre argent est protégé jusqu&apos;à livraison. Vendeur payé {protectionMinutes} min
          après, sans litige.
        </p>
      </div>
    );
  }

  if (collapsible) {
    return (
      <div className="glass-card-blue p-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-start justify-between gap-2 text-left"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-black">Vous avez le pouvoir sur votre argent</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Avec XaalisPay, fini les arnaques en ligne : votre paiement reste bloqué tant que
              vous n&apos;êtes pas satisfait.
            </p>
          </div>
          <span className="shrink-0 text-sm text-subtle">{open ? "▲" : "▼"}</span>
        </button>

        {open && (
          <div className="mt-3 space-y-2 border-t border-black/8 pt-3">
            {[
              ["1. Vous payez, on séquestre", "L'argent n'est pas envoyé au vendeur. Il est gardé par XaalisPay."],
              ["2. Vous recevez le colis", "Vérifiez le produit. Ne donnez le PIN qu'après réception."],
              [`3. ${protectionMinutes} min pour réagir`, "Problème ? Ouvrez un litige pendant le Séquestre Flash."],
              ["4. Vendeur payé si tout va bien", `Sans litige, libération ${protectionMinutes} min après livraison.`],
            ].map(([title, desc]) => (
              <div key={title} className="glass-card p-3">
                <p className="text-[11px] font-bold text-black">{title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
