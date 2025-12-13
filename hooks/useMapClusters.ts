/**
 * Hook to cluster map markers using supercluster
 * Groups nearby spots into clusters at low zoom levels for better performance and UX
 */

import { useMemo, useCallback } from "react";
import Supercluster from "supercluster";
import type { SpotWithDistance } from "@/hooks/useSpotsWithDistance";

// GeoJSON Feature type for spots
interface SpotFeature {
  type: "Feature";
  properties: {
    id: number;
    title: string;
    cluster: false;
    spot: SpotWithDistance;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
}

// Cluster feature from supercluster
interface ClusterFeature {
  type: "Feature";
  properties: {
    cluster: true;
    cluster_id: number;
    point_count: number;
    point_count_abbreviated: string | number;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

export type MapFeature = SpotFeature | ClusterFeature;

export interface ClusterPoint {
  type: "cluster";
  id: number;
  lat: number;
  lon: number;
  count: number;
  countAbbreviated: string | number;
}

export interface SpotPoint {
  type: "spot";
  lat: number;
  lon: number;
  spot: SpotWithDistance;
}

export type MapPoint = ClusterPoint | SpotPoint;

interface UseMapClustersParams {
  spots: SpotWithDistance[];
  zoom: number;
  bounds?: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  } | null;
}

interface UseMapClustersResult {
  points: MapPoint[];
  supercluster: Supercluster<SpotFeature["properties"], ClusterFeature["properties"]> | null;
  expandCluster: (clusterId: number) => { lat: number; lon: number; zoom: number } | null;
}

// Supercluster options
const CLUSTER_OPTIONS: Supercluster.Options<SpotFeature["properties"], ClusterFeature["properties"]> = {
  radius: 60, // Cluster radius in pixels
  maxZoom: 14, // Max zoom level to cluster (individual markers at zoom > 14)
  minZoom: 0,
  minPoints: 2, // Minimum points to form a cluster
};

// Maximum zoom level when expanding clusters (prevents over-zooming)
const MAX_EXPANSION_ZOOM = 16;

export function useMapClusters({
  spots,
  zoom,
  bounds,
}: UseMapClustersParams): UseMapClustersResult {
  // Create supercluster index from spots
  const supercluster = useMemo(() => {
    const validSpots = spots.filter(
      (spot) => spot.lat != null && spot.lon != null
    );

    if (validSpots.length === 0) return null;

    // Convert spots to GeoJSON features
    const features: SpotFeature[] = validSpots.map((spot) => ({
      type: "Feature",
      properties: {
        id: spot.id,
        title: spot.title,
        cluster: false,
        spot,
      },
      geometry: {
        type: "Point",
        coordinates: [spot.lon!, spot.lat!],
      },
    }));

    // Create and load supercluster
    const cluster = new Supercluster<SpotFeature["properties"], ClusterFeature["properties"]>(
      CLUSTER_OPTIONS
    );
    cluster.load(features);

    return cluster;
  }, [spots]);

  // Get clusters for current viewport
  const points = useMemo(() => {
    if (!supercluster) return [];

    // Default to world bounds if not specified
    const bbox: [number, number, number, number] = bounds
      ? [bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat]
      : [-180, -90, 180, 90];

    // Get clusters at current zoom level
    const clusters = supercluster.getClusters(bbox, Math.floor(zoom));

    // Convert to our MapPoint format
    return clusters.map((feature): MapPoint => {
      const [lon, lat] = feature.geometry.coordinates;

      if (feature.properties.cluster) {
        return {
          type: "cluster",
          id: feature.properties.cluster_id,
          lat,
          lon,
          count: feature.properties.point_count,
          countAbbreviated: feature.properties.point_count_abbreviated,
        };
      } else {
        return {
          type: "spot",
          lat,
          lon,
          spot: feature.properties.spot,
        };
      }
    });
  }, [supercluster, bounds, zoom]);

  /**
   * Expands a cluster to reveal its children spots
   * @param clusterId - The cluster ID from supercluster
   * @returns The center coordinates and zoom level to expand to, or null if expansion fails
   */
  const expandCluster = useCallback(
    (clusterId: number) => {
      if (!supercluster) return null;

      try {
        const expansionZoom = supercluster.getClusterExpansionZoom(clusterId);
        const children = supercluster.getLeaves(clusterId, Infinity);

        if (children.length === 0) return null;

        // Calculate center of cluster's children
        let sumLat = 0;
        let sumLon = 0;
        for (const child of children) {
          sumLon += child.geometry.coordinates[0];
          sumLat += child.geometry.coordinates[1];
        }

        return {
          lat: sumLat / children.length,
          lon: sumLon / children.length,
          zoom: Math.min(expansionZoom, MAX_EXPANSION_ZOOM),
        };
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to expand cluster:", clusterId, error);
        }
        return null;
      }
    },
    [supercluster]
  );

  return {
    points,
    supercluster,
    expandCluster,
  };
}
