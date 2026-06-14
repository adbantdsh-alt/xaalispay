import { NextResponse } from "next/server";
import { createProfile, isUsernameTaken } from "@/lib/orders";
import { isValidUsername } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { userId, username, displayName, businessName, phone } =
      await request.json();

    if (!userId || !username || !displayName || !businessName) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
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
    });

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
