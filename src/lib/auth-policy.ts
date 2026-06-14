import type { Profile } from "./types";

export const SUPER_ADMIN_EMAIL = "adbaxgoat@gmail.com";

/** Tag par défaut du super admin à la création du profil (modifiable ensuite). */
export const SUPER_ADMIN_DEFAULT_PROFILE = {
  username: "adba",
  displayName: "adba",
  businessName: "XaalisPay",
  phone: undefined as string | undefined,
};

/** Ancien tag imposé par erreur — migré une fois vers le tag personnel. */
export const LEGACY_FORCED_TAG = "xaalistag";

export function isSuperAdminEmail(email?: string | null): boolean {
  return email?.toLowerCase().trim() === SUPER_ADMIN_EMAIL;
}

export function canCreateProducts(
  profile: Profile | undefined,
  email?: string | null
): boolean {
  if (!profile) return false;
  if (profile.role === "super_admin" || isSuperAdminEmail(email)) return true;
  return !!profile.emailVerifiedAt;
}

export function superAdminProfileDefaults(): Pick<Profile, "role" | "emailVerifiedAt"> {
  return {
    role: "super_admin",
    emailVerifiedAt: new Date().toISOString(),
  };
}
