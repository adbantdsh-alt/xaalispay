import { getDb } from "./db";

export interface VendorSearchResult {
  username: string;
  displayName: string;
  businessName: string;
  /** Présent si le vendeur est trouvé via un produit */
  matchHint?: string;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  price: number;
  username: string;
  displayName: string;
}

export async function searchMarketplace(query: string, limit = 8) {
  const q = query.trim().toLowerCase().replace(/^@/, "");
  if (!q || q.length < 1) {
    return { vendors: [] as VendorSearchResult[], products: [] as ProductSearchResult[] };
  }

  const db = await getDb();
  const profileById = new Map(db.profiles.map((p) => [p.id, p]));
  const vendorMap = new Map<string, VendorSearchResult>();

  for (const p of db.profiles) {
    if (
      p.username.toLowerCase().includes(q) ||
      p.displayName.toLowerCase().includes(q) ||
      p.businessName.toLowerCase().includes(q)
    ) {
      vendorMap.set(p.username, {
        username: p.username,
        displayName: p.displayName,
        businessName: p.businessName,
      });
    }
  }

  const productHits: ProductSearchResult[] = [];

  for (const product of db.products) {
    if (!product.active) continue;
    const profile = profileById.get(product.sellerId);
    if (!profile) continue;

    const nameMatch = product.name.toLowerCase().includes(q);
    const descMatch = product.description.toLowerCase().includes(q);

    if (nameMatch || descMatch) {
      productHits.push({
        id: product.id,
        name: product.name,
        price: product.price,
        username: profile.username,
        displayName: profile.displayName,
      });

      if (!vendorMap.has(profile.username)) {
        vendorMap.set(profile.username, {
          username: profile.username,
          displayName: profile.displayName,
          businessName: profile.businessName,
          matchHint: `Vend : ${product.name}`,
        });
      }
    }
  }

  const vendors = [...vendorMap.values()].slice(0, limit);
  const products = productHits.slice(0, Math.ceil(limit / 2));

  return { vendors, products };
}
