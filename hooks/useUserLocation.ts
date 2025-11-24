"use client";

import { useQuery } from "@tanstack/react-query";

export interface Coordinates {
  lat: number;
  lon: number;
}

export type LocationStatus = "idle" | "loading" | "granted" | "denied" | "error";

export interface UseUserLocationResult {
  location: Coordinates | null;
  status: LocationStatus;
  error: string | null;
  requestLocation: () => void;
}

async function getUserLocation(): Promise<Coordinates> {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported by your browser");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (err) => {
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes - cache location for 5 minutes
      }
    );
  });
}

export function useUserLocation(): UseUserLocationResult {
  const query = useQuery({
    queryKey: ["userLocation"],
    queryFn: getUserLocation,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Type guard for GeolocationPositionError
  function isGeolocationError(error: unknown): error is GeolocationPositionError {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as GeolocationPositionError).code === "number"
    );
  }

  // Determine status based on query state
  let status: LocationStatus = "idle";
  if (query.isLoading) {
    status = "loading";
  } else if (query.isSuccess) {
    status = "granted";
  } else if (query.error && isGeolocationError(query.error)) {
    status = query.error.code === 1 ? "denied" : "error";
  } else if (query.error) {
    status = "error";
  }

  return {
    location: query.data ?? null,
    status,
    error: query.error?.message ?? null,
    requestLocation: () => query.refetch(),
  };
}
