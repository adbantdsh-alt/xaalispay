import { NextResponse } from "next/server";
import { hashPassword, setSessionCookie } from "@/lib/auth-local";
import { getDb, updateDb } from "@/lib/db";
import { createProfile, isUsernameTaken } from "@/lib/orders";
import { isValidUsername, slugifyUsername } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      displayName,
      businessName,
      username,
      phone,
    } = body;

    if (!email || !password || !displayName || !businessName || !username) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    const cleanUsername = slugifyUsername(username);
    if (!isValidUsername(cleanUsername)) {
      return NextResponse.json(
        {
          error:
            "Identifiant invalide : 3-20 caractères, lettres minuscules, chiffres et _",
        },
        { status: 400 }
      );
    }

    const db = await getDb();
    const emailTaken = db.authUsers.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (emailTaken) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    if (await isUsernameTaken(cleanUsername)) {
      return NextResponse.json(
        { error: "Cet identifiant est déjà pris" },
        { status: 409 }
      );
    }

    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    await updateDb((d) => {
      d.authUsers.push({
        id: userId,
        email: email.toLowerCase(),
        passwordHash,
        createdAt: new Date().toISOString(),
      });
    });

    await createProfile({
      id: userId,
      username: cleanUsername,
      displayName: displayName.trim(),
      businessName: businessName.trim(),
      phone: phone?.trim() || undefined,
    });

    await setSessionCookie(userId, email.toLowerCase());

    return NextResponse.json({
      user: { id: userId, email: email.toLowerCase() },
      profile: { username: cleanUsername },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erreur lors de la création du compte",
      },
      { status: 500 }
    );
  }
}
