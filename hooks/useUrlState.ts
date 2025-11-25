/**
 * Hook to sync application state with URL query parameters
 * Enables back/forward navigation with preserved state
 */

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useMemo } from "react";
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

  // Map bounds (only if all params present and valid)
  const minLatStr = params.get("minLat");
  const maxLatStr = params.get("maxLat");
  const minLonStr = params.get("minLon");
  const maxLonStr = params.get("maxLon");

  if (minLatStr && maxLatStr && minLonStr && maxLonStr) {
    const parsedMinLat = parseFloat(minLatStr);
    const parsedMaxLat = parseFloat(maxLatStr);
    const parsedMinLon = parseFloat(minLonStr);
    const parsedMaxLon = parseFloat(maxLonStr);

    // Validate all are valid numbers before setting bounds
    if (
      !isNaN(parsedMinLat) &&
      !isNaN(parsedMaxLat) &&
      !isNaN(parsedMinLon) &&
      !isNaN(parsedMaxLon)
    ) {
      state.bounds = {
        minLat: parsedMinLat,
        maxLat: parsedMaxLat,
        minLon: parsedMinLon,
        maxLon: parsedMaxLon,
      };
    }
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
   * Get initial state from URL on mount (memoized to avoid recalculation)
   * Note: We deliberately don't include searchParams in dependencies to prevent
   * recreating initial state on every URL change - we only want it on mount
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialState = useMemo(() => deserializeState(searchParams), []);

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
    initialState,
    updateUrl,
  };
}
