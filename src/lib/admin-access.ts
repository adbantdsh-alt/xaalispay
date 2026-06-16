import { NextResponse } from "next/server";
import { getSellerAccess } from "./profile-access";
import { getSessionUser } from "./session";

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }),
    } as const;
  }

  const access = await getSellerAccess(user.id, user.email);
  if (!access.isSuperAdmin) {
    return {
      error: NextResponse.json({ error: "Accès admin refusé" }, { status: 403 }),
    } as const;
  }

  return { user, access } as const;
}
