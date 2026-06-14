"use client";

import Link from "next/link";
import { FloatingSheet } from "@/components/ui/FloatingSheet";

const SETTINGS_LINKS = [
  { href: "/create?tab=tag", label: "Mon XaalisTag", desc: "Modifier votre identifiant public" },
  { href: "/create", label: "Mes produits", desc: "Gérer produits et liens de paiement" },
  { href: "/wallet", label: "Portefeuille", desc: "Solde et retraits" },
  { href: "/history", label: "Historique", desc: "Ventes et commandes" },
  { href: "/contact", label: "Contact & aide", desc: "Support XaalisPay" },
  { href: "/cgv", label: "Conditions générales", desc: "" },
  { href: "/confidentialite", label: "Confidentialité", desc: "" },
] as const;

export function SettingsSheet({
  open,
  onClose,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <FloatingSheet open={open} onClose={onClose} title="Paramètres">
      <nav className="settings-sheet-list">
        {SETTINGS_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="settings-sheet-item"
            onClick={onClose}
          >
            <span className="settings-sheet-item-label">{item.label}</span>
            {item.desc && <span className="settings-sheet-item-desc">{item.desc}</span>}
          </Link>
        ))}
      </nav>
      <button type="button" className="btn-ghost settings-sheet-logout" onClick={onLogout}>
        Se déconnecter
      </button>
    </FloatingSheet>
  );
}
