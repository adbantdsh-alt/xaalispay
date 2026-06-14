"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const username = query.trim().replace(/^@/, "").toLowerCase();
    if (!username) return;
    router.push(`/${username}`);
  };

  return (
    <div className="page-shell">
      <header className="pt-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0F1F66] to-[#0FD5C7] text-2xl font-bold text-white shadow-lg">
          XP
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">XaalisPay</h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
          Payez les yeux fermés
        </p>
      </header>

      <section className="card mt-8 p-5">
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          Achetez en ligne sans risque. Votre argent reste en{" "}
          <strong className="text-[var(--primary)]">séquestre</strong> jusqu&apos;à
          réception du colis. Le vendeur n&apos;est payé qu&apos;après validation —
          plus jamais arnaqué.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-bold">Trouver un vendeur</h2>
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
              @
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="identifiant_vendeur"
              className="input-field pl-9"
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Voir la boutique
          </button>
        </form>
      </section>

      <section className="mt-8 grid grid-cols-2 gap-3">
        <Link href="/auth" className="btn-outline w-full text-center">
          Connexion
        </Link>
        <Link href="/auth?mode=signup" className="btn-primary w-full text-center">
          Créer un compte vendeur
        </Link>
      </section>

      <section className="mt-8 space-y-3">
        <div className="card p-4">
          <p className="text-xs font-bold text-[#0FD5C7]">SÉQUESTRE</p>
          <p className="mt-1 text-sm">
            L&apos;argent est bloqué chez XaalisPay, pas chez le vendeur.
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold text-[#0FD5C7]">SÉQUESTRE FLASH</p>
          <p className="mt-1 text-sm">
            30 min après validation du code PIN, les fonds sont libérés si aucun litige.
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold text-[#0FD5C7]">REMBOURSEMENT AUTO</p>
          <p className="mt-1 text-sm">
            Pas de livraison validée dans le délai ? Remboursement automatique au client.
          </p>
        </div>
      </section>
    </div>
  );
}
