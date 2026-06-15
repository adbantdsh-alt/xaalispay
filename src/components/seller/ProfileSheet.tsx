"use client";

import Link from "next/link";
import { FloatingSheet } from "@/components/ui/FloatingSheet";
import { buildShopPath } from "@/lib/site-url";

export interface ProfileSheetData {
  username: string;
  displayName: string;
  businessName: string;
  phone?: string;
}

export function ProfileSheet({
  open,
  onClose,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  profile: ProfileSheetData | null;
}) {
  if (!profile) return null;

  const initial = profile.displayName.charAt(0).toUpperCase();

  return (
    <FloatingSheet open={open} onClose={onClose} title="Mon profil">
      <div className="profile-sheet-user">
        <div className="profile-sheet-avatar">{initial}</div>
        <div>
          <p className="profile-sheet-name">{profile.displayName}</p>
          <p className="profile-sheet-tag">@{profile.username}</p>
        </div>
      </div>

      <div className="profile-sheet-rows">
        {[
          ["XaalisTag", `@${profile.username}`],
          ["Boutique", profile.businessName],
          ["Pays", "Sénégal"],
          ["Devise", "FCFA"],
          ...(profile.phone ? [["Téléphone", profile.phone] as const] : []),
        ].map(([label, value]) => (
          <div key={label} className="profile-sheet-row">
            <span className="text-muted">{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>

      <Link href={buildShopPath(profile.username)} className="btn-secondary" onClick={onClose}>
        Voir ma page publique
      </Link>
    </FloatingSheet>
  );
}
