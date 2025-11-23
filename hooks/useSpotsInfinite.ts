/**
 * Hook to fetch paginated spots using TanStack Query infinite scroll
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import type { CalisthenicsSpot } from "@/data/calisthenics-spots.types";

interface PaginatedResponse {
  spots: CalisthenicsSpot[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

interface UseSpotsInfiniteParams {
  limit?: number;
  searchQuery?: string;
}

async function fetchSpots({
  pageParam = 0,
  limit,
  searchQuery,
}: {
  pageParam: number;
  limit: number;
  searchQuery?: string;
}): Promise<PaginatedResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: pageParam.toString(),
  });

  if (searchQuery) {
    params.set("search", searchQuery);
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
}: UseSpotsInfiniteParams = {}) {
  const query = useInfiniteQuery({
    queryKey: ["spots", { limit, searchQuery }],
    queryFn: ({ pageParam }) => fetchSpots({ pageParam, limit, searchQuery }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.offset;
      }
      return undefined;
    },
    initialPageParam: 0,
  });

  // Flatten all pages into a single array
  const spots = query.data?.pages.flatMap((page) => page.spots) ?? [];
  const total = query.data?.pages[0]?.pagination.total ?? 0;
  const hasMore = query.hasNextPage ?? false;

  return {
    spots,
    total,
    hasMore,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    error: query.error?.message ?? null,
    loadMore: () => query.fetchNextPage(),
    refetch: () => query.refetch(),
  };
}
