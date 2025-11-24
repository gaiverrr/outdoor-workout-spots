"use client";

import { useMemo } from "react";
import type { SpotWithDistance } from "./useSpotsWithDistance";

export interface FilterOptions {
  hasBars: boolean;
  hasRings: boolean;
  hasTrack: boolean;
}

export interface UseFilteredSpotsParams {
  spots: SpotWithDistance[];
  searchQuery: string;
  filters: FilterOptions;
}

export function useFilteredSpots({
  spots,
  searchQuery,
  filters,
}: UseFilteredSpotsParams): SpotWithDistance[] {
  return useMemo(() => {
    let filtered = spots;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((spot) => {
        const titleMatch = spot.title?.toLowerCase().includes(query);
        const nameMatch = spot.name?.toLowerCase().includes(query);
        const addressMatch = spot.address?.toLowerCase().includes(query);
        return titleMatch || nameMatch || addressMatch;
      });
    }

    // Filter by equipment
    if (filters.hasBars || filters.hasRings || filters.hasTrack) {
      filtered = filtered.filter((spot) => {
        if (!spot.details?.equipment) return false;

        const equipment = spot.details.equipment?.map((e) => e.toLowerCase());
        const equipmentString = equipment.join(" ");

        let matches = true;

        if (filters.hasBars) {
          matches =
            matches &&
            (equipmentString.includes("bar") ||
              equipmentString.includes("pull-up") ||
              equipmentString.includes("calisthenics park"));
        }

        if (filters.hasRings) {
          matches = matches && equipmentString.includes("ring");
        }

        if (filters.hasTrack) {
          matches =
            matches &&
            (equipmentString.includes("track") ||
              equipmentString.includes("tartan"));
        }

        return matches;
      });
    }

    return filtered;
  }, [spots, searchQuery, filters]);
}
