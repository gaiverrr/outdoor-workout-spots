"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  type MapRef,
} from "react-map-gl/maplibre";
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
  onViewportChange?: (center: { lat: number; lng: number }, zoom: number) => void;
  initialBounds?: MapBounds | null;
  initialCenter?: { lat: number; lng: number } | null;
  initialZoom?: number | null;
}

const DEFAULT_CENTER: [number, number] = [0, 20];
const DEFAULT_ZOOM = 2;
const SELECTED_ZOOM = 13;
const FIT_BOUNDS_PADDING = 20;

function normalizeLongitude(lon: number): number {
  if (!isFinite(lon)) return 0;
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

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

  if (maxLon - minLon >= 360) return null;

  return {
    minLat: Math.max(-90, Math.min(90, minLat)),
    maxLat: Math.max(-90, Math.min(90, maxLat)),
    minLon: normalizeLongitude(minLon),
    maxLon: normalizeLongitude(maxLon),
  };
}

function getCenterFromBounds(bounds: MapBounds): [number, number] {
  return [(bounds.minLon + bounds.maxLon) / 2, (bounds.minLat + bounds.maxLat) / 2];
}

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
  onViewportChange,
  initialBounds,
  initialCenter,
  initialZoom,
}: SpotsMapProps) {
  const mapRef = useRef<MapRef>(null);
  const hasFittedBounds = useRef(false);
  const hasFlewToUser = useRef(false);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);

  // Fly to user location when it becomes available (and no URL state to restore)
  const hasUrlState = !!(initialCenter || initialBounds);
  useEffect(() => {
    if (
      userLocation &&
      mapRef.current &&
      !hasFlewToUser.current &&
      !hasUrlState
    ) {
      hasFlewToUser.current = true;
      mapRef.current.flyTo({
        center: [userLocation.lon, userLocation.lat],
        zoom: 12,
        duration: 1500,
      });
    }
  }, [userLocation, hasUrlState]);

  const { points, expandCluster } = useMapClusters({
    spots,
    zoom: currentZoom,
    bounds: currentBounds,
  });

  const { center, zoom } = useMemo(() => {
    if (initialCenter && initialZoom != null) {
      return {
        center: [initialCenter.lng, initialCenter.lat] as [number, number],
        zoom: initialZoom,
      };
    }

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
      return { center: getCenterFromBounds(initialBounds), zoom: DEFAULT_ZOOM };
    }

    if (userLocation) {
      return {
        center: [userLocation.lon, userLocation.lat] as [number, number],
        zoom: 11,
      };
    }

    return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
  }, [userLocation, selectedSpotId, spots, initialBounds, initialCenter, initialZoom]);

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

  const updateBoundsAndZoom = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const center = map.getCenter();

    setCurrentZoom(zoom);
    onViewportChange?.({ lat: center.lat, lng: center.lng }, zoom);

    if (!bounds) return;
    const normalizedBounds = normalizeBounds(bounds);
    setCurrentBounds(normalizedBounds);
    onBoundsChange?.(normalizedBounds);
  }, [onBoundsChange, onViewportChange]);

  const handleLoad = useCallback(() => {
    if (!mapRef.current) return;
    if (initialBounds && !hasFittedBounds.current && !initialCenter) {
      hasFittedBounds.current = true;
      mapRef.current.getMap().fitBounds(
        [
          [initialBounds.minLon, initialBounds.minLat],
          [initialBounds.maxLon, initialBounds.maxLat],
        ],
        { padding: FIT_BOUNDS_PADDING, duration: 0 }
      );
    }
    if (initialBounds) {
      requestAnimationFrame(() => updateBoundsAndZoom());
    } else {
      updateBoundsAndZoom();
    }
  }, [updateBoundsAndZoom, initialBounds, initialCenter]);

  const selectedSpot = selectedSpotId
    ? spots.find((s) => s.id === selectedSpotId)
    : null;

  return (
    <div className="relative w-full h-full" data-testid="spots-map">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: center[0], latitude: center[1], zoom }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        attributionControl={false}
        onMove={updateBoundsAndZoom}
        onLoad={handleLoad}
      >
        <NavigationControl position="top-right" />

        {userLocation && (
          <Marker longitude={userLocation.lon} latitude={userLocation.lat} anchor="center">
            <div className="relative">
              <div className="w-3.5 h-3.5 bg-accent-secondary rounded-full border-2 border-white shadow-lg" />
              <div className="absolute inset-0 w-3.5 h-3.5 bg-accent-secondary rounded-full animate-ping opacity-50" />
            </div>
          </Marker>
        )}

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
                    transition-transform duration-150 hover:scale-110
                    bg-accent border-2 border-white/80 shadow-md"
                  style={{ width: size, height: size }}
                  aria-label={`Cluster of ${point.count} spots`}
                >
                  <span className="text-white font-bold text-sm">
                    {point.countAbbreviated}
                  </span>
                </button>
              </Marker>
            );
          }

          const { spot, lat, lon } = point;
          const isSelected = spot.id === selectedSpotId;

          return (
            <Marker
              key={`spot-${spot.id}`}
              longitude={lon}
              latitude={lat}
              anchor="bottom"
              onClick={() => onSelectSpot?.(spot.id)}
            >
              <button
                className={`transition-transform duration-150 cursor-pointer
                  ${isSelected ? "scale-125 z-10" : "hover:scale-110 z-0"}`}
                aria-label={`View ${spot.title}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center
                    border-2 shadow-md transition-colors duration-150
                    ${isSelected
                      ? "bg-accent border-white"
                      : "bg-elevated border-border hover:bg-accent hover:border-white"
                    }`}
                >
                  <span className="text-white text-xs font-bold">💪</span>
                </div>
              </button>
            </Marker>
          );
        })}

        {selectedSpot?.lat && selectedSpot?.lon && (
          <Popup
            longitude={selectedSpot.lon}
            latitude={selectedSpot.lat}
            anchor="bottom"
            offset={40}
            onClose={() => onSelectSpot?.(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-3 min-w-[200px] max-w-[280px]">
              <h3 className="text-sm font-semibold text-text-primary mb-1.5 line-clamp-2">
                {selectedSpot.title}
              </h3>
              {selectedSpot.address && (
                <p className="text-xs text-text-dim mb-1.5 line-clamp-1">
                  {selectedSpot.address}
                </p>
              )}
              {selectedSpot.distanceKm != null && (
                <p className="text-xs text-accent-secondary mb-1.5">
                  {selectedSpot.distanceKm.toFixed(1)} km away
                </p>
              )}
              {selectedSpot.details?.rating != null && (
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs text-text-secondary">
                    Rating: {selectedSpot.details.rating}/100
                  </span>
                </div>
              )}
              <Link
                href={`/spots/${selectedSpot.id}`}
                className="block w-full text-center text-sm font-medium py-2 px-3 rounded-lg
                  bg-accent text-white hover:bg-accent-hover transition-colors duration-150"
                data-testid="spot-view-details"
              >
                View Details
              </Link>
            </div>
          </Popup>
        )}
      </Map>

      <div className="absolute bottom-2 right-2 text-[10px] text-text-dim bg-black/50 px-1.5 py-0.5 rounded">
        © OpenStreetMap | CARTO
      </div>
    </div>
  );
}
