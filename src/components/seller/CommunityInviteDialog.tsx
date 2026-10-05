"use client";

import { MessageCircle } from "lucide-react";
import { WHATSAPP_COMMUNITY_URL } from "@/lib/community";

const BENEFITS = [
  "Astuces pour vendre plus et rassurer vos clients",
  "Les nouveautés XaalisPay en avant-première",
  "Entraide entre vendeurs et réponses rapides de l'équipe",
];

export function CommunityInviteDialog({
  open,
  onClose,
  onJoin,
}: {
  open: boolean;
  onClose: () => void;
  onJoin: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-sheet community-invite-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-invite-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-sheet-handle" />
        <div className="community-invite-icon" aria-hidden="true">
          <MessageCircle size={26} strokeWidth={1.75} />
        </div>
        <h3 id="community-invite-title" className="community-invite-title">
          Rejoignez la communauté XaalisPay
        </h3>
        <p className="community-invite-lead">
          Échangez avec d&apos;autres vendeurs et l&apos;équipe XaalisPay, directement sur
          WhatsApp. C&apos;est gratuit.
        </p>
        <ul className="community-invite-list">
          {BENEFITS.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <a
          href={WHATSAPP_COMMUNITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-seller-primary"
          onClick={onJoin}
        >
          Rejoindre sur WhatsApp
        </a>
        <button type="button" className="community-invite-later" onClick={onClose}>
          Plus tard
        </button>
      </div>
    </div>
  );
}
