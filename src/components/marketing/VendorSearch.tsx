"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { buildShopPath } from "@/lib/site-url";

interface VendorHit {
  username: string;
  displayName: string;
  businessName: string;
}

interface ProductHit {
  id: string;
  name: string;
  price: number;
  username: string;
  displayName: string;
}

function normalizeQuery(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function VendorSearch({ large = false }: { large?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [vendors, setVendors] = useState<VendorHit[]>([]);
  const [products, setProducts] = useState<ProductHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allItems = [
    ...vendors.map((v) => ({ type: "vendor" as const, ...v })),
    ...products.map((p) => ({ type: "product" as const, ...p })),
  ];

  const fetchSuggestions = useCallback(async (q: string) => {
    const clean = normalizeQuery(q);
    if (!clean) {
      setVendors([]);
      setProducts([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors || []);
        setProducts(data.products || []);
        setOpen(true);
        setActiveIndex(-1);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToVendor = (username: string) => {
    setOpen(false);
    setQuery("");
    router.push(buildShopPath(username));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeQuery(query);
    if (!clean) return;

    if (activeIndex >= 0 && allItems[activeIndex]) {
      const item = allItems[activeIndex];
      goToVendor(item.type === "vendor" ? item.username : item.username);
      return;
    }

    if (vendors.length > 0) {
      goToVendor(vendors[0].username);
      return;
    }

    goToVendor(clean);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || allItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % allItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? allItems.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const hasResults = vendors.length > 0 || products.length > 0;

  return (
    <div ref={wrapperRef} className={`vendor-search ${large ? "vendor-search-lg" : ""}`}>
      <form onSubmit={handleSubmit}>
        <div className="vendor-search-row">
          <span className="vendor-search-prefix" aria-hidden="true">
            @
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value.replace(/^@+/, ""))}
            onFocus={() => query && hasResults && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="XaalisTag ou nom de produit"
            className="vendor-search-input"
            autoComplete="off"
            aria-label="Rechercher un vendeur ou un produit"
            aria-expanded={open}
            aria-autocomplete="list"
          />
          {loading && <span className="vendor-search-spinner" aria-hidden="true" />}
        </div>
        <button type="submit" className="btn-relief-blue vendor-search-btn">
          Voir la boutique
        </button>
      </form>

      {open && hasResults && (
        <ul className="vendor-search-dropdown" role="listbox">
          {vendors.length > 0 && (
            <li className="vendor-search-group-label" role="presentation">
              Vendeurs
            </li>
          )}
          {vendors.map((v, i) => (
            <li key={v.username} role="option" aria-selected={activeIndex === i}>
              <button
                type="button"
                className={`vendor-search-item ${activeIndex === i ? "vendor-search-item-active" : ""}`}
                onMouseDown={() => goToVendor(v.username)}
              >
                <span className="vendor-search-item-at">@{v.username}</span>
                <span className="vendor-search-item-meta">
                  {v.displayName}
                  {v.businessName ? ` · ${v.businessName}` : ""}
                </span>
              </button>
            </li>
          ))}

          {products.length > 0 && (
            <li className="vendor-search-group-label" role="presentation">
              Produits
            </li>
          )}
          {products.map((p, i) => {
            const idx = vendors.length + i;
            return (
              <li key={p.id} role="option" aria-selected={activeIndex === idx}>
                <button
                  type="button"
                  className={`vendor-search-item ${activeIndex === idx ? "vendor-search-item-active" : ""}`}
                  onMouseDown={() => goToVendor(p.username)}
                >
                  <span className="vendor-search-item-at">{p.name}</span>
                  <span className="vendor-search-item-meta">
                    @{p.username} · {formatCurrency(p.price)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {open && !loading && query && !hasResults && (
        <p className="vendor-search-empty">Aucun vendeur ou produit trouvé</p>
      )}
    </div>
  );
}
