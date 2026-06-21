"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

export interface GeographyTown {
  id: string;
  name: string;
}

export interface GeographyDepartment {
  id: string;
  name: string;
  town: GeographyTown;
}

export interface GeographyRegion {
  id: string;
  name: string;
  departments: GeographyDepartment[];
}

// Référentiel statique (régions/départements/villes du Sénégal) — ne change
// quasiment jamais, partagé entre tous les usages de ProductFields dans la
// même session (création + édition) pour éviter de le re-fetcher à chaque fois.
let cached: GeographyRegion[] | null = null;
let pending: Promise<GeographyRegion[]> | null = null;

async function fetchGeography(): Promise<GeographyRegion[]> {
  if (cached) return cached;
  if (!pending) {
    pending = apiFetch("/api/catalog/geography")
      .then(async (res) => {
        if (!res.ok) return [];
        const data = await res.json();
        return (data as Array<Record<string, unknown>>).map((r) => ({
          id: String(r.id),
          name: r.name as string,
          departments: (r.departments as Array<Record<string, unknown>>).map((d) => ({
            id: String(d.id),
            name: d.name as string,
            town: { id: String((d.town as Record<string, unknown>).id), name: (d.town as Record<string, unknown>).name as string },
          })),
        }));
      })
      .then((regions) => {
        cached = regions;
        return regions;
      });
  }
  return pending;
}

export function useGeography() {
  const [regions, setRegions] = useState<GeographyRegion[]>(cached || []);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (cached) return;
    let active = true;
    fetchGeography().then((regions) => {
      if (active) {
        setRegions(regions);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { regions, loading };
}
