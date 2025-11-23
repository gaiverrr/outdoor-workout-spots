"use client";

import { useQuery } from "@tanstack/react-query";
import type { CalisthenicsSpot } from "@/data/calisthenics-spots.types";

export interface UseSpotsResult {
  spots: CalisthenicsSpot[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

async function fetchSpots(): Promise<CalisthenicsSpot[]> {
  const response = await fetch("/api/spots");

  if (!response.ok) {
    throw new Error(`Failed to fetch spots: ${response.statusText}`);
  }

  return response.json();
}

/**
 * @deprecated Use useSpotsInfinite instead for better performance with pagination
 */
export function useSpots(): UseSpotsResult {
  const query = useQuery({
    queryKey: ["spots", "all"],
    queryFn: fetchSpots,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    spots: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: () => {
      query.refetch();
    },
  };
}
