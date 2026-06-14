import { updateDb } from "./db";
import {
  canCreateProducts,
  isSuperAdminEmail,
  LEGACY_FORCED_TAG,
  SUPER_ADMIN_DEFAULT_PROFILE,
  superAdminProfileDefaults,
} from "./auth-policy";
import { createProfile, getProfileById, isUsernameTaken } from "./orders";
import type { Profile } from "./types";

async function pickSuperAdminUsername(userId: string): Promise<string> {
  const candidates = [
    SUPER_ADMIN_DEFAULT_PROFILE.username,
    `admin_${userId.slice(0, 8)}`,
  ];

  for (const username of candidates) {
    if (!(await isUsernameTaken(username, userId))) return username;
  }

  return `admin_${userId.slice(0, 8)}`;
}

/** Corrige l'ancien tag forcé « xaalistag » vers le tag personnel (ex. adba). */
async function migrateLegacyForcedTag(
  userId: string,
  profile: Profile
): Promise<Profile> {
  if (profile.username !== LEGACY_FORCED_TAG) return profile;

  const target = SUPER_ADMIN_DEFAULT_PROFILE.username;
  if (await isUsernameTaken(target, userId)) return profile;

  await updateDb((db) => {
    const p = db.profiles.find((x) => x.id === userId);
    if (!p || p.username !== LEGACY_FORCED_TAG) return;
    p.username = target;
    if (p.displayName === LEGACY_FORCED_TAG) {
      p.displayName = SUPER_ADMIN_DEFAULT_PROFILE.displayName;
    }
  });

  return (await getProfileById(userId)) || profile;
}

export async function markProfileEmailVerified(
  userId: string
): Promise<Profile | null> {
  let updated: Profile | null = null;
  const now = new Date().toISOString();

  await updateDb((db) => {
    const profile = db.profiles.find((p) => p.id === userId);
    if (!profile) return;
    profile.emailVerifiedAt = now;
    updated = profile;
  });

  return updated;
}

export async function ensureSuperAdminProfile(
  userId: string,
  email?: string | null
): Promise<Profile | undefined> {
  if (!isSuperAdminEmail(email)) {
    return getProfileById(userId);
  }

  let profile = await getProfileById(userId);
  const defaults = superAdminProfileDefaults();

  if (!profile) {
    profile = await createProfile({
      id: userId,
      username: await pickSuperAdminUsername(userId),
      displayName: SUPER_ADMIN_DEFAULT_PROFILE.displayName,
      businessName: SUPER_ADMIN_DEFAULT_PROFILE.businessName,
      phone: SUPER_ADMIN_DEFAULT_PROFILE.phone,
      role: defaults.role,
      emailVerifiedAt: defaults.emailVerifiedAt,
    });
    return profile;
  }

  if (profile.role !== "super_admin" || !profile.emailVerifiedAt) {
    await updateDb((db) => {
      const p = db.profiles.find((x) => x.id === userId);
      if (!p) return;
      p.role = defaults.role;
      p.emailVerifiedAt = defaults.emailVerifiedAt;
    });
    profile = await getProfileById(userId);
  }

  return profile ? migrateLegacyForcedTag(userId, profile) : undefined;
}

export async function getSellerAccess(userId: string, email?: string | null) {
  const profile = await ensureSuperAdminProfile(userId, email);
  return {
    profile,
    canCreateProducts: canCreateProducts(profile, email),
    isSuperAdmin: isSuperAdminEmail(email) || profile?.role === "super_admin",
    emailVerified: !!profile?.emailVerifiedAt,
  };
}
