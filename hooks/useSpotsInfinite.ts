/**
 * Hook to fetch paginated spots using TanStack Query infinite scroll
 */

import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { CalisthenicsSpot } from "@/data/calisthenics-spots.types";
import type { MapBounds } from "@/components/Map/SpotsMap";

interface PaginatedResponse {
  spots: CalisthenicsSpot[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface UseSpotsInfiniteParams {
  limit?: number;
  searchQuery?: string;
  bounds?: MapBounds | null;
}

async function fetchSpots({
  pageParam = 0,
  limit,
  searchQuery,
  bounds,
}: {
  pageParam: number;
  limit: number;
  searchQuery?: string;
  bounds?: MapBounds | null;
}): Promise<PaginatedResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: pageParam.toString(),
  });

  if (searchQuery) {
    params.set("search", searchQuery);
  }

  // Add map bounds for viewport filtering
  if (bounds) {
    params.set("minLat", bounds.minLat.toString());
    params.set("maxLat", bounds.maxLat.toString());
    params.set("minLon", bounds.minLon.toString());
    params.set("maxLon", bounds.maxLon.toString());
  }

  const response = await fetch(`/api/spots?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch spots");
  }

  return response.json();
}

export function useSpotsInfinite({
  limit = 100,
  searchQuery = "",
  bounds = null,
}: UseSpotsInfiniteParams = {}) {
  // We start with bounds as null. The query is disabled initially.
  // Once the map loads and provides bounds (or null for world view), the query runs.
  const [boundsInitialized, setBoundsInitialized] = React.useState(false);

  React.useEffect(() => {
    // Mark bounds as initialized once we receive the first bounds update (even if null)
    if (!boundsInitialized) {
      setBoundsInitialized(true);
    }
  }, [bounds, boundsInitialized]);

  const query = useInfiniteQuery({
    queryKey: ["spots", { limit, searchQuery, bounds }],
    queryFn: ({ pageParam }) => fetchSpots({ pageParam, limit, searchQuery, bounds }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.offset + lastPage.spots.length;
      }
      return undefined;
    },
    initialPageParam: 0,
    // Enable query after bounds are initialized (first map load)
    // This prevents the query from running before the map loads
    enabled: boundsInitialized,
  });

  // Flatten all pages into a single array
  const spots = query.data?.pages.flatMap((page) => page.spots) ?? [];
  const hasMore = query.hasNextPage ?? false;

  return {
    spots,
    hasMore,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    error: query.error?.message ?? null,
    loadMore: () => query.fetchNextPage(),
    refetch: () => query.refetch(),
  };
}
