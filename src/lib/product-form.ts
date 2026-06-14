const MAX_IMAGE_BYTES = 450_000;

export async function fileToDataUrl(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  if (file.size > MAX_IMAGE_BYTES) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
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
