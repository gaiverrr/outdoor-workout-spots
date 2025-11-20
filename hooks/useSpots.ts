"use client";

import { useState, useEffect } from "react";
import type { CalisthenicsSpot } from "@/data/calisthenics-spots.types";

export interface UseSpotsResult {
  spots: CalisthenicsSpot[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSpots(): UseSpotsResult {
  const [spots, setSpots] = useState<CalisthenicsSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpots = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/spots");

      if (!response.ok) {
        throw new Error(`Failed to fetch spots: ${response.statusText}`);
      }

      const data = await response.json();
      setSpots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load spots");
      console.error("Error fetching spots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  return {
    spots,
    loading,
    error,
    refetch: fetchSpots,
  };
}
