/**
 * Hook to sync application state with URL query parameters
 * Enables back/forward navigation with preserved state
 */

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import type { MapBounds } from "@/components/Map/SpotsMap";
import type { FilterOptions } from "@/hooks/useFilteredSpots";

export interface UrlState {
  bounds: MapBounds | null;
  searchQuery: string;
  filters: FilterOptions;
  selectedSpotId: number | null;
}

/**
 * Serialize state to URL search params
 */
function serializeState(state: Partial<UrlState>): URLSearchParams {
  const params = new URLSearchParams();

  // Map bounds (only if all values present)
  if (state.bounds) {
    params.set("minLat", state.bounds.minLat.toFixed(6));
    params.set("maxLat", state.bounds.maxLat.toFixed(6));
    params.set("minLon", state.bounds.minLon.toFixed(6));
    params.set("maxLon", state.bounds.maxLon.toFixed(6));
  }

  // Search query
  if (state.searchQuery) {
    params.set("q", state.searchQuery);
  }

  // Filters (only set if true)
  if (state.filters?.hasBars) params.set("bars", "1");
  if (state.filters?.hasRings) params.set("rings", "1");
  if (state.filters?.hasTrack) params.set("track", "1");

  // Selected spot
  if (state.selectedSpotId) {
    params.set("spot", state.selectedSpotId.toString());
  }

  return params;
}

/**
 * Deserialize URL search params to state
 */
function deserializeState(params: URLSearchParams): Partial<UrlState> {
  const state: Partial<UrlState> = {};

  // Map bounds (only if all params present)
  const minLat = params.get("minLat");
  const maxLat = params.get("maxLat");
  const minLon = params.get("minLon");
  const maxLon = params.get("maxLon");

  if (minLat && maxLat && minLon && maxLon) {
    state.bounds = {
      minLat: parseFloat(minLat),
      maxLat: parseFloat(maxLat),
      minLon: parseFloat(minLon),
      maxLon: parseFloat(maxLon),
    };
  }

  // Search query
  const query = params.get("q");
  if (query) {
    state.searchQuery = query;
  }

  // Filters
  state.filters = {
    hasBars: params.get("bars") === "1",
    hasRings: params.get("rings") === "1",
    hasTrack: params.get("track") === "1",
  };

  // Selected spot
  const spot = params.get("spot");
  if (spot) {
    state.selectedSpotId = parseInt(spot, 10);
  }

  return state;
}

/**
 * Custom hook to manage URL state synchronization
 */
export function useUrlState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Get initial state from URL on mount
   */
  const getInitialState = useCallback((): Partial<UrlState> => {
    return deserializeState(searchParams);
  }, [searchParams]);

  /**
   * Update URL with new state (debounced for performance)
   */
  const updateUrl = useCallback(
    (state: Partial<UrlState>, immediate = false) => {
      // Clear existing timer
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }

      const update = () => {
        const params = serializeState(state);
        const queryString = params.toString();
        const url = queryString ? `${pathname}?${queryString}` : pathname;

        // Use replace to avoid creating too many history entries during map pan/zoom
        router.replace(url, { scroll: false });
      };

      if (immediate) {
        update();
      } else {
        // Debounce URL updates to avoid excessive history entries
        updateTimerRef.current = setTimeout(update, 300);
      }
    },
    [pathname, router]
  );

  /**
   * Cleanup timer on unmount
   */
  useEffect(() => {
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, []);

  return {
    getInitialState,
    updateUrl,
  };
}
