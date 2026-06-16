import { createAdminClient } from "./supabase/admin";

export const PRODUCT_IMAGE_BUCKET = "product-images";
/** Taille max fichier brut côté client (avant compression). */
export const MAX_PRODUCT_IMAGE_INPUT_BYTES = 5 * 1024 * 1024; // 5 Mo
/** Taille max acceptée après compression / fallback inline. */
export const MAX_PRODUCT_IMAGE_STORED_BYTES = 900_000;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function isAllowedImageMime(mime: string): boolean {
  return ALLOWED_MIME.has(mime);
}

export function resolveProductImageUrl(image?: string | null): string {
  if (!image?.trim()) return "";
  const trimmed = image.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return trimmed;
  const path = trimmed.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path}`;
}

export function withResolvedProductImage<T extends { image?: string }>(product: T): T {
  return { ...product, image: resolveProductImageUrl(product.image) };
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
}

export async function uploadProductImageBuffer(
  sellerId: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase non configuré — ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local");
  }

  if (!isAllowedImageMime(mimeType)) {
    throw new Error("Format image non supporté (JPEG, PNG, WebP, GIF)");
  }

  if (buffer.byteLength > MAX_PRODUCT_IMAGE_STORED_BYTES) {
    throw new Error("Image trop lourde après compression (max ~900 Ko)");
  }

  const ext =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : mimeType === "image/gif"
          ? "gif"
          : "jpg";
  const path = `${sellerId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await admin.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
    cacheControl: "31536000",
  });

  if (error) {
    console.error("uploadProductImageBuffer:", error.message);
    throw new Error(`Upload Supabase échoué : ${error.message}`);
  }

  const { data } = admin.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Normalise l'image produit avant sauvegarde :
 * - URL http(s) → conservée
 * - data URL → upload Supabase si configuré, sinon inline si < 900 Ko
 * - chemin relatif bucket → URL publique
 */
export async function persistProductImage(
  sellerId: string,
  image: string | undefined | null
): Promise<string> {
  if (!image?.trim()) return "";

  const trimmed = image.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("data:")) {
    const parsed = parseDataUrl(trimmed);
    if (!parsed) return "";

    const admin = createAdminClient();
    if (admin) {
      return uploadProductImageBuffer(sellerId, parsed.buffer, parsed.mime);
    }

    if (parsed.buffer.byteLength > MAX_PRODUCT_IMAGE_STORED_BYTES) {
      throw new Error(
        "Image trop lourde. Configurez Supabase Storage ou compressez l'image (max ~900 Ko en local)."
      );
    }
    return trimmed;
  }

  return resolveProductImageUrl(trimmed);
}

export async function deleteProductImageIfStored(imageUrl: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin || !imageUrl) return;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base || !imageUrl.startsWith(base)) return;

  const prefix = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
  const idx = imageUrl.indexOf(prefix);
  if (idx === -1) return;

  const path = decodeURIComponent(imageUrl.slice(idx + prefix.length));
  await admin.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
}
