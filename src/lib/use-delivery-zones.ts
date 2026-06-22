"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { adaptDeliveryZone } from "@/lib/api-adapters";
import type { DeliveryZone } from "@/lib/types";

/** Pas de cache mémoire partagé (contrairement à l'ancien use-geography) : les
 * zones sont mutables par le vendeur depuis Paramètres, un cache statique
 * risquerait d'afficher des zones obsolètes juste après une modification. */
export function useDeliveryZones() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await apiFetch("/api/catalog/delivery-zones/");
    if (res.ok) {
      const data = await res.json();
      setZones((data as Array<Record<string, unknown>>).map(adaptDeliveryZone));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { zones, loading, refresh };
}
