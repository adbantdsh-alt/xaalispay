import { NextResponse } from "next/server";
import { isSuperAdminEmail, superAdminProfileDefaults } from "@/lib/auth-policy";
import { createProfile, getProfileById, isUsernameTaken, updateProfilePhone, updateProfileUsername } from "@/lib/orders";
import { ensureSuperAdminProfile } from "@/lib/profile-access";
import { getSessionUser } from "@/lib/session";
import { isValidUsername } from "@/lib/utils";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { userId, username, displayName, businessName, phone, email } =
      await request.json();

    if (!userId || userId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    if (!username || !displayName || !businessName) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    const existing = await getProfileById(userId);
    if (existing) {
      return NextResponse.json({ profile: existing });
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: "Identifiant invalide" },
        { status: 400 }
      );
    }

    if (await isUsernameTaken(username)) {
      return NextResponse.json(
        { error: "Cet identifiant est déjà pris" },
        { status: 409 }
      );
    }

    const profile = await createProfile({
      id: userId,
      username,
      displayName,
      businessName,
      phone,
      ...(isSuperAdminEmail(email) ? superAdminProfileDefaults() : {}),
    });

    const ensured = await ensureSuperAdminProfile(userId, email);
    return NextResponse.json({ profile: ensured || profile });
  } catch (err) {
    console.error("Profile creation error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Erreur lors de la création du profil",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { username, phone } = body as { username?: string; phone?: string };

    if (username === undefined && phone === undefined) {
      return NextResponse.json({ error: "Aucune modification demandée" }, { status: 400 });
    }

    let profile = await getProfileById(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    if (username !== undefined) {
      if (!username.trim()) {
        return NextResponse.json({ error: "XaalisTag requis" }, { status: 400 });
      }
      const result = await updateProfileUsername(user.id, username);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      profile = result.profile;
    }

    if (phone !== undefined) {
      const result = await updateProfilePhone(user.id, phone);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      profile = result.profile;
    }

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
