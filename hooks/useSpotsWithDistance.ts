"use client";

import { useMemo } from "react";
import type { CalisthenicsSpot } from "@/data/calisthenics-spots.types";
import type { Coordinates } from "./useUserLocation";
import { getDistanceKm } from "@/lib/distance";

export interface SpotWithDistance extends CalisthenicsSpot {
  distanceKm?: number;
}

export interface UseSpotsWithDistanceParams {
  spots: CalisthenicsSpot[];
  userLocation: Coordinates | null;
}

export function useSpotsWithDistance({
  spots,
  userLocation,
}: UseSpotsWithDistanceParams): SpotWithDistance[] {
  return useMemo(() => {
    if (!userLocation) {
      return spots;
    }

    const spotsWithDistance = spots
      .map((spot): SpotWithDistance => {
        // Only calculate distance if spot has coordinates
        if (spot.lat == null || spot.lon == null) {
          return spot;
        }

        const distanceKm = getDistanceKm(userLocation, {
          lat: spot.lat,
          lon: spot.lon,
        });

        return {
          ...spot,
          distanceKm,
        };
      })
      .sort((a, b) => {
        // Sort by distance, spots without distance go to the end
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });

    return spotsWithDistance;
  }, [spots, userLocation]);
}
