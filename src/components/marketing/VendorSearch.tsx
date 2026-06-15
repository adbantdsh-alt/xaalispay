"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { VendorProductGrid, type VendorProduct } from "@/components/marketing/VendorProductGrid";

interface VendorHit {
  username: string;
  displayName: string;
  businessName: string;
  matchHint?: string;
}

function normalizeQuery(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function VendorSearch({ large = false }: { large?: boolean }) {
  const [query, setQuery] = useState("");
  const [vendors, setVendors] = useState<VendorHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const [selectedVendor, setSelectedVendor] = useState<VendorHit | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [vendorError, setVendorError] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    const clean = normalizeQuery(q);
    if (!clean) {
      setVendors([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors || []);
        setOpen(true);
        setActiveIndex(-1);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVendorProducts = useCallback(async (vendor: VendorHit) => {
    setSelectedVendor(vendor);
    setOpen(false);
    setQuery(vendor.username);
    setProductsLoading(true);
    setProducts([]);
    setVendorError(null);

    try {
      const res = await fetch(`/api/vendors/${encodeURIComponent(vendor.username)}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        setVendorError("Vendeur introuvable. Vérifiez le XaalisTag.");
        setSelectedVendor(null);
        setQuery(vendor.username);
      }
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedVendor) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions, selectedVendor]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetVendor = () => {
    setSelectedVendor(null);
    setProducts([]);
    setQuery("");
    setVendors([]);
    setOpen(false);
  };

  const selectVendor = (vendor: VendorHit) => {
    loadVendorProducts(vendor);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVendor) return;

    const clean = normalizeQuery(query);
    if (!clean) return;

    if (activeIndex >= 0 && vendors[activeIndex]) {
      selectVendor(vendors[activeIndex]);
      return;
    }

    if (vendors.length > 0) {
      selectVendor(vendors[0]);
      return;
    }

    loadVendorProducts({
      username: clean,
      displayName: clean,
      businessName: "",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedVendor || !open || vendors.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % vendors.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? vendors.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const hasResults = vendors.length > 0;

  return (
    <div ref={wrapperRef} className={`vendor-search ${large ? "vendor-search-lg" : ""}`}>
      {!selectedVendor ? (
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
              placeholder="XaalisTag ou nom du vendeur"
              className="vendor-search-input"
              autoComplete="off"
              aria-label="Rechercher un vendeur"
              aria-expanded={open}
              aria-autocomplete="list"
            />
            {loading && <span className="vendor-search-spinner" aria-hidden="true" />}
          </div>
          {open && hasResults && (
            <ul className="vendor-search-dropdown" role="listbox">
              <li className="vendor-search-group-label" role="presentation">
                Vendeurs
              </li>
              {vendors.map((v, i) => (
                <li key={v.username} role="option" aria-selected={activeIndex === i}>
                  <button
                    type="button"
                    className={`vendor-search-item ${activeIndex === i ? "vendor-search-item-active" : ""}`}
                    onMouseDown={() => selectVendor(v)}
                  >
                    <span className="vendor-search-item-at">@{v.username}</span>
                    <span className="vendor-search-item-meta">
                      {v.displayName}
                      {v.businessName ? ` · ${v.businessName}` : ""}
                      {v.matchHint ? ` · ${v.matchHint}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {open && !loading && query && !hasResults && (
            <p className="vendor-search-empty">Aucun vendeur trouvé</p>
          )}

          {vendorError && <p className="vendor-search-error">{vendorError}</p>}
        </form>
      ) : (
        <VendorProductGrid
          vendor={selectedVendor}
          products={products}
          loading={productsLoading}
          onChangeVendor={resetVendor}
        />
      )}
    </div>
  );
}
