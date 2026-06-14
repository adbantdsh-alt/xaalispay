import { updateDb } from "./db";
import {
  canCreateProducts,
  isSuperAdminEmail,
  superAdminProfileDefaults,
} from "./auth-policy";
import { getProfileById } from "./orders";
import type { Profile } from "./types";

export function markProfileEmailVerified(userId: string): Profile | null {
  let updated: Profile | null = null;
  const now = new Date().toISOString();

  updateDb((db) => {
    const profile = db.profiles.find((p) => p.id === userId);
    if (!profile) return;
    profile.emailVerifiedAt = now;
    updated = profile;
  });

  return updated;
}

export function ensureSuperAdminProfile(
  userId: string,
  email?: string | null
): Profile | undefined {
  if (!isSuperAdminEmail(email)) {
    return getProfileById(userId);
  }

  let profile = getProfileById(userId);
  if (!profile) return undefined;

  if (profile.role === "super_admin" && profile.emailVerifiedAt) {
    return profile;
  }

  const defaults = superAdminProfileDefaults();
  updateDb((db) => {
    const p = db.profiles.find((x) => x.id === userId);
    if (!p) return;
    p.role = defaults.role;
    p.emailVerifiedAt = defaults.emailVerifiedAt;
    profile = p;
  });

  return profile;
}

export function getSellerAccess(userId: string, email?: string | null) {
  const profile = ensureSuperAdminProfile(userId, email);
  return {
    profile,
    canCreateProducts: canCreateProducts(profile, email),
    isSuperAdmin: isSuperAdminEmail(email) || profile?.role === "super_admin",
    emailVerified: !!profile?.emailVerifiedAt,
  };
}
