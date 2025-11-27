"use client";

import { useCallback, useMemo, useRef } from "react";
import Map, { Marker, Popup, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import Link from "next/link";
import type { SpotWithDistance } from "@/hooks/useSpotsWithDistance";
import type { Coordinates } from "@/hooks/useUserLocation";
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
  onBoundsChange?: (bounds: MapBounds | null) => void; // null = world wrap, fetch without bounds
  initialBounds?: MapBounds | null; // Initial bounds from URL state
}

const DEFAULT_CENTER: [number, number] = [0, 20]; // Centered on Europe/Africa
const DEFAULT_ZOOM = 2;
const SELECTED_ZOOM = 13;

/**
 * Normalize longitude to -180 to 180 range
 *
 * Formula explanation:
 * 1. (lon + 180): Shift to [0, 360) range
 * 2. % 360: Take modulo to wrap around
 * 3. + 360: Handle negative results from modulo
 * 4. % 360: Ensure positive result
 * 5. - 180: Shift back to [-180, 180) range
 *
 * Note: For extremely large values (> 1e15), floating point precision
 * may cause inaccuracies, but MapLibre GL won't return such values.
 */
function normalizeLongitude(lon: number): number {
  // Sanity check for unreasonable values
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

  // Check if viewport spans more than 360 degrees (full world wrap or more)
  const lonSpan = maxLon - minLon;
  if (lonSpan >= 360) {
    // Viewport is too large, don't apply bounds filtering
    return null;
  }

  // Normalize longitude values to -180 to 180
  const normalizedMinLon = normalizeLongitude(minLon);
  const normalizedMaxLon = normalizeLongitude(maxLon);

  // Clamp latitude to valid range (-90 to 90)
  const clampedMinLat = Math.max(-90, Math.min(90, minLat));
  const clampedMaxLat = Math.max(-90, Math.min(90, maxLat));

  return {
    minLat: clampedMinLat,
    maxLat: clampedMaxLat,
    minLon: normalizedMinLon,
    maxLon: normalizedMaxLon,
  };
}

/**
 * Calculate map center and zoom from bounds
 */
function getCenterFromBounds(bounds: MapBounds): { center: [number, number]; zoom: number } {
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;

  // Rough zoom estimation based on latitude span
  const latSpan = bounds.maxLat - bounds.minLat;
  let zoom = DEFAULT_ZOOM;
  if (latSpan < 0.01) zoom = 15;
  else if (latSpan < 0.05) zoom = 13;
  else if (latSpan < 0.2) zoom = 11;
  else if (latSpan < 1) zoom = 9;
  else if (latSpan < 5) zoom = 7;
  else if (latSpan < 20) zoom = 5;
  else if (latSpan < 50) zoom = 3;

  return { center: [centerLon, centerLat], zoom };
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

  // Calculate map center and zoom
  const { center, zoom } = useMemo(() => {
    // Priority 1: Selected spot (zoom to specific location)
    if (selectedSpotId) {
      const selectedSpot = spots.find((s) => s.id === selectedSpotId);
      if (selectedSpot?.lat != null && selectedSpot?.lon != null) {
        return {
          center: [selectedSpot.lon, selectedSpot.lat] as [number, number],
          zoom: SELECTED_ZOOM,
        };
      }
    }

    // Priority 2: Initial bounds from URL (restored state)
    if (initialBounds) {
      return getCenterFromBounds(initialBounds);
    }

    // Priority 3: User location
    if (userLocation) {
      return {
        center: [userLocation.lon, userLocation.lat] as [number, number],
        zoom: 11,
      };
    }

    // Priority 4: Default world view
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

  // Get bounds from map and call callback
  const updateBounds = useCallback(() => {
    if (!mapRef.current || !onBoundsChange) return;

    const map = mapRef.current.getMap();
    const bounds = map.getBounds();
    if (!bounds) return;

    // Normalize and validate bounds
    // Returns null if viewport is too large (world wrap) - in this case we fetch without bounds
    const normalizedBounds = normalizeBounds(bounds);

    // Always call callback, even if bounds are null (world wrap)
    onBoundsChange(normalizedBounds);
  }, [onBoundsChange]);

  // Handle map viewport changes (pan, zoom)
  const handleMove = useCallback(() => {
    updateBounds();
  }, [updateBounds]);

  // Handle initial map load to get initial bounds
  const handleLoad = useCallback(() => {
    updateBounds();
  }, [updateBounds]);

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

        {/* Spot markers */}
        {spots.map((spot) => {
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
                {/* Marker pin */}
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
                {/* Marker shadow */}
                <div className="absolute -bottom-1 w-6 h-2 bg-black/20 rounded-full blur-sm" />
              </button>
            </Marker>
          );
        })}

        {/* Popup for selected spot */}
        {selectedSpotId && (() => {
          const selectedSpot = spots.find((s) => s.id === selectedSpotId);
          if (!selectedSpot?.lat || !selectedSpot?.lon) return null;

          return (
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
                {/* Title */}
                <h3 className="text-base font-bold text-white mb-2 line-clamp-2">
                  {selectedSpot.title}
                </h3>

                {/* Address */}
                {selectedSpot.address && (
                  <p className="text-xs text-text-dim mb-2 line-clamp-2">
                    📍 {selectedSpot.address}
                  </p>
                )}

                {/* Distance */}
                {selectedSpot.distanceKm != null && (
                  <p className="text-xs text-neon-cyan mb-2">
                    📏 {selectedSpot.distanceKm.toFixed(1)} km away
                  </p>
                )}

                {/* Rating */}
                {selectedSpot.details?.rating && (
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-xs">⭐</span>
                    <span className="text-xs text-neon-lime font-semibold">
                      {selectedSpot.details.rating}/5
                    </span>
                  </div>
                )}

                {/* View Details Button */}
                <Link
                  href={`/spots/${selectedSpot.id}`}
                  className="group relative block w-full text-center text-sm font-semibold py-3 px-4 rounded-lg
                    glass border border-neon-cyan/20
                    hover:border-neon-cyan hover:bg-neon-cyan/5
                    text-white transition-all duration-200
                    hover:scale-[1.02] hover:shadow-[0_10px_30px_-10px_rgba(34,211,238,0.4)]
                    active:scale-[0.98]"
                >
                  {/* Animated gradient overlay on hover */}
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-neon-purple/10 to-neon-magenta/10 animate-gradient" />
                  </div>

                  {/* Button text */}
                  <span className="relative z-10">View Details →</span>
                </Link>
              </div>
            </Popup>
          );
        })()}
      </Map>

      {/* Map attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-text-dim bg-black/50 px-2 py-1 rounded">
        © OpenStreetMap | CARTO
      </div>
    </div>
  );
}
