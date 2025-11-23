/**
 * Hook to fetch paginated spots from Turso database
 */

import { useState, useEffect, useCallback } from "react";
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

interface UseSpotsPaginatedResult {
  spots: CalisthenicsSpot[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  loadMore: () => void;
  reload: () => void;
}

export function useSpotsPaginated(
  limit: number = 100,
  searchQuery?: string
): UseSpotsPaginatedResult {
  const [spots, setSpots] = useState<CalisthenicsSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  const fetchSpots = useCallback(
    async (currentOffset: number, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: currentOffset.toString(),
        });

        if (searchQuery) {
          params.set("search", searchQuery);
        }

        const response = await fetch(`/api/spots-paginated?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch spots");
        }

        const data: PaginatedResponse = await response.json();

        if (append) {
          setSpots((prev) => [...prev, ...data.spots]);
        } else {
          setSpots(data.spots);
        }

        setHasMore(data.pagination.hasMore);
        setTotal(data.pagination.total);
        setOffset(currentOffset + data.spots.length);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [limit, searchQuery]
  );

  // Initial load and reload when search changes
  useEffect(() => {
    setOffset(0);
    setSpots([]);
    fetchSpots(0, false);
  }, [fetchSpots]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchSpots(offset, true);
    }
  }, [offset, hasMore, loadingMore, fetchSpots]);

  const reload = useCallback(() => {
    setOffset(0);
    setSpots([]);
    fetchSpots(0, false);
  }, [fetchSpots]);

  return {
    spots,
    loading: loading || loadingMore,
    error,
    hasMore,
    total,
    loadMore,
    reload,
  };
}
