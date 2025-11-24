"use client";

import { useCallback, useMemo, useRef } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre";
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
  onSelectSpot?: (spotId: number) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  initialBounds?: MapBounds | null; // Initial bounds from URL state
}

const DEFAULT_CENTER: [number, number] = [0, 20]; // Centered on Europe/Africa
const DEFAULT_ZOOM = 2;
const SELECTED_ZOOM = 13;

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

    onBoundsChange({
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLon: bounds.getWest(),
      maxLon: bounds.getEast(),
    });
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
      </Map>

      {/* Map attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-text-dim bg-black/50 px-2 py-1 rounded">
        © OpenStreetMap | CARTO
      </div>
    </div>
  );
}
