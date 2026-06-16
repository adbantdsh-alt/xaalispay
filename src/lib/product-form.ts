/** Compression + upload images produit (client). */

import {
  MAX_PRODUCT_IMAGE_INPUT_BYTES,
  MAX_PRODUCT_IMAGE_STORED_BYTES,
} from "./product-images";

export const MAX_IMAGE_INPUT_MB = MAX_PRODUCT_IMAGE_INPUT_BYTES / (1024 * 1024);

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Format non supporté");
  }

  if (file.size <= MAX_PRODUCT_IMAGE_STORED_BYTES && file.type === "image/jpeg") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Compression impossible");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.88;
  let blob: Blob | null = null;

  for (let i = 0; i < 6; i++) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) break;
    if (blob.size <= MAX_PRODUCT_IMAGE_STORED_BYTES) break;
    quality -= 0.12;
  }

  if (!blob) {
    throw new Error("Compression impossible");
  }

  if (blob.size > MAX_PRODUCT_IMAGE_STORED_BYTES) {
    throw new Error("Image trop lourde même après compression (max ~900 Ko)");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "product";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

export async function uploadProductImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Format non supporté");
  }
  if (file.size > MAX_PRODUCT_IMAGE_INPUT_BYTES) {
    throw new Error(`Image max ${MAX_IMAGE_INPUT_MB} Mo`);
  }

  const compressed = await compressImageFile(file);
  const formData = new FormData();
  formData.append("file", compressed, compressed.name);

  const res = await fetch("/api/products/upload-image", {
    method: "POST",
    body: formData,
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error || "Upload échoué");
  }
  return data.url;
}

export function normalizeProductFields(data: {
  name?: string;
  description?: string;
  price?: number;
  deliveryCost?: number;
  deliveryHours?: number;
  note?: string;
  image?: string;
}) {
  return {
    name: (data.name || "").trim(),
    description: (data.description || "").trim(),
    price: Number(data.price) || 0,
    deliveryCost: Number(data.deliveryCost) || 0,
    deliveryHours: Number(data.deliveryHours) || 48,
    note: (data.note || "").trim(),
    image: data.image || "",
  };
}

/** @deprecated Utiliser uploadProductImageFile */
export async function fileToDataUrl(file: File): Promise<string | null> {
  try {
    return await uploadProductImageFile(file);
  } catch {
    return null;
  }
}
