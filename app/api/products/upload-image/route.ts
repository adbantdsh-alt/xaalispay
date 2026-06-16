import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  isAllowedImageMime,
  MAX_PRODUCT_IMAGE_INPUT_BYTES,
  MAX_PRODUCT_IMAGE_STORED_BYTES,
  uploadProductImageBuffer,
} from "@/lib/product-images";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier image requis" }, { status: 400 });
  }

  if (!isAllowedImageMime(file.type)) {
    return NextResponse.json(
      { error: "Format non supporté — utilisez JPEG, PNG ou WebP" },
      { status: 400 }
    );
  }

  if (file.size > MAX_PRODUCT_IMAGE_INPUT_BYTES) {
    return NextResponse.json(
      { error: "Image trop lourde (max 5 Mo)" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.byteLength > MAX_PRODUCT_IMAGE_STORED_BYTES) {
    return NextResponse.json(
      {
        error:
          "Image encore trop lourde après compression (~900 Ko max). Réduisez la résolution ou la qualité.",
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    if (process.env.NODE_ENV === "development" && buffer.byteLength <= MAX_PRODUCT_IMAGE_STORED_BYTES) {
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${file.type};base64,${base64}`;
      return NextResponse.json({ url: dataUrl, storage: "inline" });
    }
    return NextResponse.json(
      {
        error:
          "Stockage Supabase non configuré. Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY, puis exécutez supabase/product_images.sql.",
      },
      { status: 503 }
    );
  }

  try {
    const url = await uploadProductImageBuffer(user.id, buffer, file.type);
    return NextResponse.json({ url, storage: "supabase" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload échoué";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
