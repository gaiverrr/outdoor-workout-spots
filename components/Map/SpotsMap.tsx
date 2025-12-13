"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Map, { Marker, Popup, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import Link from "next/link";
import type { SpotWithDistance } from "@/hooks/useSpotsWithDistance";
import type { Coordinates } from "@/hooks/useUserLocation";
import { useMapClusters, type MapPoint } from "@/hooks/useMapClusters";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface SpotsMapProps {
  spots: SpotWithDistance[];
  userLocation?: Coordinates | null;
  selectedSpotId?: number | null;
  onSelectSpot?: (spotId: number | null) => void;
  onBoundsChange?: (bounds: MapBounds | null) => void;
  initialBounds?: MapBounds | null;
}

const DEFAULT_CENTER: [number, number] = [0, 20];
const DEFAULT_ZOOM = 2;
const SELECTED_ZOOM = 13;
const FIT_BOUNDS_PADDING = 20;

/**
 * Normalize longitude to -180 to 180 range
 */
function normalizeLongitude(lon: number): number {
  if (!isFinite(lon)) {
    return 0;
  }
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

/**
 * Validate and normalize map bounds
 * Returns null if viewport is too large (world wrap) or invalid
 */
function normalizeBounds(bounds: {
  getSouth: () => number;
  getNorth: () => number;
  getWest: () => number;
  getEast: () => number;
}): MapBounds | null {
  const minLat = bounds.getSouth();
  const maxLat = bounds.getNorth();
  const minLon = bounds.getWest();
  const maxLon = bounds.getEast();

  const lonSpan = maxLon - minLon;
  if (lonSpan >= 360) {
    return null;
  }

  const normalizedMinLon = normalizeLongitude(minLon);
  const normalizedMaxLon = normalizeLongitude(maxLon);

  const clampedMinLat = Math.max(-90, Math.min(90, minLat));
  const clampedMaxLat = Math.max(-90, Math.min(90, maxLat));

  return {
    minLat: clampedMinLat,
    maxLat: clampedMaxLat,
    minLon: normalizedMinLon,
    maxLon: normalizedMaxLon,
  };
}

function getCenterFromBounds(bounds: MapBounds): [number, number] {
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  return [centerLon, centerLat];
}

/**
 * Get cluster marker size based on point count
 */
function getClusterSize(count: number): number {
  if (count < 10) return 36;
  if (count < 50) return 42;
  if (count < 100) return 48;
  if (count < 500) return 54;
  return 60;
}

export function SpotsMap({
  spots,
  userLocation,
  selectedSpotId,
  onSelectSpot,
  onBoundsChange,
  initialBounds,
}: SpotsMapProps) {
  const mapRef = useRef<MapRef>(null);
  const hasFittedBounds = useRef(false);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);

  // Use clustering for markers
  const { points, expandCluster } = useMapClusters({
    spots,
    zoom: currentZoom,
    bounds: currentBounds,
  });

  // Calculate initial map center and zoom
  const { center, zoom } = useMemo(() => {
    if (selectedSpotId) {
      const selectedSpot = spots.find((s) => s.id === selectedSpotId);
      if (selectedSpot?.lat != null && selectedSpot?.lon != null) {
        return {
          center: [selectedSpot.lon, selectedSpot.lat] as [number, number],
          zoom: SELECTED_ZOOM,
        };
      }
    }

    if (initialBounds) {
      return {
        center: getCenterFromBounds(initialBounds),
        zoom: DEFAULT_ZOOM,
      };
    }

    if (userLocation) {
      return {
        center: [userLocation.lon, userLocation.lat] as [number, number],
        zoom: 11,
      };
    }

    return {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    };
  }, [userLocation, selectedSpotId, spots, initialBounds]);

  const handleMarkerClick = useCallback(
    (spotId: number) => {
      onSelectSpot?.(spotId);
    },
    [onSelectSpot]
  );

  // Handle cluster click - zoom to expand
  const handleClusterClick = useCallback(
    (clusterId: number) => {
      const expansion = expandCluster(clusterId);
      if (expansion && mapRef.current) {
        mapRef.current.flyTo({
          center: [expansion.lon, expansion.lat],
          zoom: expansion.zoom,
          duration: 500,
        });
      }
    },
    [expandCluster]
  );

  // Get bounds and zoom from map
  const updateBoundsAndZoom = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    const bounds = map.getBounds();
    const zoom = map.getZoom();

    setCurrentZoom(zoom);

    if (!bounds) return;

    const normalizedBounds = normalizeBounds(bounds);
    setCurrentBounds(normalizedBounds);
    onBoundsChange?.(normalizedBounds);
  }, [onBoundsChange]);

  const handleMove = useCallback(() => {
    updateBoundsAndZoom();
  }, [updateBoundsAndZoom]);

  const handleLoad = useCallback(() => {
    if (!mapRef.current) return;

    if (initialBounds && !hasFittedBounds.current) {
      hasFittedBounds.current = true;
      const map = mapRef.current.getMap();

      map.fitBounds(
        [
          [initialBounds.minLon, initialBounds.minLat],
          [initialBounds.maxLon, initialBounds.maxLat],
        ],
        {
          padding: FIT_BOUNDS_PADDING,
          duration: 0,
        }
      );
    }

    if (initialBounds) {
      setTimeout(() => updateBoundsAndZoom(), 50);
    } else {
      updateBoundsAndZoom();
    }
  }, [updateBoundsAndZoom, initialBounds]);

  // Find selected spot for popup
  const selectedSpot = selectedSpotId
    ? spots.find((s) => s.id === selectedSpotId)
    : null;

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: center[0],
          latitude: center[1],
          zoom,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        attributionControl={false}
        onMove={handleMove}
        onLoad={handleLoad}
      >
        <NavigationControl position="top-right" />

        {/* User location marker */}
        {userLocation && (
          <Marker
            longitude={userLocation.lon}
            latitude={userLocation.lat}
            anchor="center"
          >
            <div className="relative">
              <div className="w-4 h-4 bg-neon-cyan rounded-full border-2 border-white shadow-lg pulse-glow" />
              <div className="absolute inset-0 w-4 h-4 bg-neon-cyan rounded-full animate-ping opacity-75" />
            </div>
          </Marker>
        )}

        {/* Render clusters and individual spots */}
        {points.map((point: MapPoint) => {
          if (point.type === "cluster") {
            const size = getClusterSize(point.count);
            return (
              <Marker
                key={`cluster-${point.id}`}
                longitude={point.lon}
                latitude={point.lat}
                anchor="center"
                onClick={() => handleClusterClick(point.id)}
              >
                <button
                  className="flex items-center justify-center rounded-full cursor-pointer
                    transition-all duration-200 hover:scale-110
                    bg-gradient-to-br from-neon-purple to-neon-magenta
                    border-2 border-white/80 shadow-lg
                    hover:shadow-[0_0_20px_rgba(168,85,247,0.6)]"
                  style={{
                    width: size,
                    height: size,
                  }}
                  aria-label={`Cluster of ${point.count} spots. Click to zoom in.`}
                >
                  <span className="text-white font-bold text-sm drop-shadow-md">
                    {point.countAbbreviated}
                  </span>
                </button>
              </Marker>
            );
          }

          // Individual spot marker
          const spot = point.spot;
          if (spot.lat == null || spot.lon == null) return null;

          const isSelected = spot.id === selectedSpotId;

          return (
            <Marker
              key={spot.id}
              longitude={spot.lon}
              latitude={spot.lat}
              anchor="bottom"
              onClick={() => handleMarkerClick(spot.id)}
            >
              <button
                className={`
                  relative flex items-center justify-center
                  transition-all duration-300 cursor-pointer
                  ${
                    isSelected
                      ? "scale-125 z-10"
                      : "scale-100 hover:scale-110 z-0"
                  }
                `}
                aria-label={`View ${spot.title}`}
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    border-2 shadow-lg transition-all
                    ${
                      isSelected
                        ? "bg-neon-magenta border-white border-glow-magenta"
                        : "bg-neon-purple border-white hover:bg-neon-magenta"
                    }
                  `}
                >
                  <span className="text-white text-xs font-bold">💪</span>
                </div>
                <div className="absolute -bottom-1 w-6 h-2 bg-black/20 rounded-full blur-sm" />
              </button>
            </Marker>
          );
        })}

        {/* Popup for selected spot */}
        {selectedSpot?.lat && selectedSpot?.lon && (
          <Popup
            longitude={selectedSpot.lon}
            latitude={selectedSpot.lat}
            anchor="bottom"
            offset={40}
            onClose={() => onSelectSpot?.(null)}
            closeButton={true}
            closeOnClick={false}
            className="spot-popup"
          >
            <div className="p-3 min-w-[200px] max-w-[280px]">
              <h3 className="text-base font-bold text-white mb-2 line-clamp-2">
                {selectedSpot.title}
              </h3>

              {selectedSpot.address && (
                <p className="text-xs text-text-dim mb-2 line-clamp-2">
                  📍 {selectedSpot.address}
                </p>
              )}

              {selectedSpot.distanceKm != null && (
                <p className="text-xs text-neon-cyan mb-2">
                  📏 {selectedSpot.distanceKm.toFixed(1)} km away
                </p>
              )}

              {selectedSpot.details?.rating && (
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-xs">⭐</span>
                  <span className="text-xs text-neon-lime font-semibold">
                    {selectedSpot.details.rating}/5
                  </span>
                </div>
              )}

              <Link
                href={`/spots/${selectedSpot.id}`}
                className="group relative block w-full text-center text-sm font-semibold py-3 px-4 rounded-lg
                  glass border border-neon-cyan/20
                  hover:border-neon-cyan hover:bg-neon-cyan/5
                  text-white transition-all duration-200
                  hover:scale-[1.02] hover:shadow-[0_10px_30px_-10px_rgba(34,211,238,0.4)]
                  active:scale-[0.98]"
              >
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-neon-purple/10 to-neon-magenta/10 animate-gradient" />
                </div>
                <span className="relative z-10">View Details →</span>
              </Link>
            </div>
          </Popup>
        )}
      </Map>

      {/* Map attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-text-dim bg-black/50 px-2 py-1 rounded">
        © OpenStreetMap | CARTO
      </div>
    </div>
  );
}
