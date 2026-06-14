import { NextResponse } from "next/server";
import { isSuperAdminEmail, superAdminProfileDefaults } from "@/lib/auth-policy";
import { createProfile, getProfileById, isUsernameTaken, updateProfileUsername } from "@/lib/orders";
import { ensureSuperAdminProfile } from "@/lib/profile-access";
import { getSessionUser } from "@/lib/session";
import { isValidUsername } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { userId, username, displayName, businessName, phone, email } =
      await request.json();

    if (!userId || !username || !displayName || !businessName) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    const existing = getProfileById(userId);
    if (existing) {
      return NextResponse.json({ profile: existing });
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: "Identifiant invalide" },
        { status: 400 }
      );
    }

    if (isUsernameTaken(username)) {
      return NextResponse.json(
        { error: "Cet identifiant est déjà pris" },
        { status: 409 }
      );
    }

    const profile = createProfile({
      id: userId,
      username,
      displayName,
      businessName,
      phone,
      ...(isSuperAdminEmail(email) ? superAdminProfileDefaults() : {}),
    });

    return NextResponse.json({ profile: ensureSuperAdminProfile(userId, email) || profile });
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
    const { username } = await request.json();
    if (!username?.trim()) {
      return NextResponse.json({ error: "Pseudo requis" }, { status: 400 });
    }

    const result = updateProfileUsername(user.id, username);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ profile: result.profile });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
