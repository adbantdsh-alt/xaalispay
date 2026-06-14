import { readDb } from "./db";

export interface VendorSearchResult {
  username: string;
  displayName: string;
  businessName: string;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  price: number;
  username: string;
  displayName: string;
}

export function searchMarketplace(query: string, limit = 8) {
  const q = query.trim().toLowerCase().replace(/^@/, "");
  if (!q || q.length < 1) {
    return { vendors: [] as VendorSearchResult[], products: [] as ProductSearchResult[] };
  }

  const db = readDb();
  const vendorLimit = Math.ceil(limit / 2);
  const productLimit = Math.ceil(limit / 2);

  const vendors = db.profiles
    .filter(
      (p) =>
        p.username.toLowerCase().includes(q) ||
        p.displayName.toLowerCase().includes(q) ||
        p.businessName.toLowerCase().includes(q)
    )
    .slice(0, vendorLimit)
    .map((p) => ({
      username: p.username,
      displayName: p.displayName,
      businessName: p.businessName,
    }));

  const profileById = new Map(db.profiles.map((p) => [p.id, p]));

  const products = db.products
    .filter((p) => p.active)
    .filter((p) => {
      const profile = profileById.get(p.sellerId);
      if (!profile) return false;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        profile.username.toLowerCase().includes(q)
      );
    })
    .slice(0, productLimit)
    .map((p) => {
      const profile = profileById.get(p.sellerId)!;
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        username: profile.username,
        displayName: profile.displayName,
      };
    });

  return { vendors, products };
}
