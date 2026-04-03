"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { SpotsMap, type MapBounds } from "@/components/Map/SpotsMap";
import { SpotsList } from "@/components/Spots/SpotsList";
import { SearchBar } from "@/components/Search/SearchBar";
import { useSpotsInfinite } from "@/hooks/useSpotsInfinite";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useSpotsWithDistance } from "@/hooks/useSpotsWithDistance";
import { useFilteredSpots } from "@/hooks/useFilteredSpots";
import { useUrlState } from "@/hooks/useUrlState";
import { BottomSheet } from "@/components/BottomSheet";
import { SpotPreview } from "@/components/SpotPreview";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";

const EMPTY_FILTERS = { hasBars: false, hasRings: false, hasTrack: false };

function HomeContent() {
  const { isTWA } = useTelegramWebApp();
  const { initialState: urlState, updateUrl } = useUrlState();

  const [searchQuery, setSearchQuery] = useState(urlState.searchQuery || "");
  const filters = EMPTY_FILTERS;
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(
    urlState.selectedSpotId || null
  );
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(
    urlState.bounds || null
  );
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(
    urlState.mapCenter || null
  );
  const [mapZoom, setMapZoom] = useState<number | null>(urlState.mapZoom || null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstBoundsUpdate = useRef(true);
  const boundsFromUrl = useRef(!!urlState.bounds);

  const { location: userLocation, status: locationStatus, requestLocation } = useUserLocation();

  const handleBoundsChange = useCallback((bounds: MapBounds | null) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (boundsFromUrl.current) {
      boundsFromUrl.current = false;
      isFirstBoundsUpdate.current = false;
      return;
    }

    if (isFirstBoundsUpdate.current) {
      isFirstBoundsUpdate.current = false;
      setMapBounds(bounds);
    } else {
      debounceTimerRef.current = setTimeout(() => setMapBounds(bounds), 500);
    }
  }, []);

  const handleViewportChange = useCallback(
    (center: { lat: number; lng: number }, zoom: number) => {
      setMapCenter(center);
      setMapZoom(zoom);
    },
    []
  );

  useEffect(() => {
    updateUrl({
      bounds: mapBounds,
      searchQuery,
      filters,
      selectedSpotId,
      mapCenter,
      mapZoom,
    });
  }, [mapBounds, searchQuery, filters, selectedSpotId, mapCenter, mapZoom, updateUrl]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const {
    spots,
    loading: spotsLoading,
    loadingMore,
    error: spotsError,
    hasMore,
    loadMore,
  } = useSpotsInfinite({ limit: 100, searchQuery, bounds: mapBounds });

  const spotsWithDistance = useSpotsWithDistance({ spots, userLocation });
  const filteredSpots = useFilteredSpots({ spots: spotsWithDistance, searchQuery, filters });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top bar: search + filters — visible on desktop, hidden on mobile */}
      <div className="hidden md:block bg-surface border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="w-80 flex-shrink-0">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <div className="ml-auto flex items-center gap-3">
            {locationStatus === "idle" && (
              <button
                onClick={requestLocation}
                className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary
                  bg-elevated border border-border rounded-lg transition-colors duration-150"
                data-testid="locate-me"
              >
                📍 Locate me
              </button>
            )}
            {locationStatus === "loading" && (
              <span className="text-sm text-accent-secondary">Locating...</span>
            )}
            <span className="text-sm text-text-dim">
              {filteredSpots.length} spots
            </span>
          </div>
        </div>
      </div>

      {/* Main content: sidebar + map */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:flex-col w-[360px] flex-shrink-0 border-r border-border bg-app overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">
              {userLocation ? "Nearby Spots" : "All Spots"}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <SpotsList
              spots={filteredSpots}
              selectedSpotId={selectedSpotId}
              onSelectSpot={setSelectedSpotId}
              loading={spotsLoading}
              error={spotsError}
            />
            {hasMore && !spotsLoading && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 text-sm font-medium bg-elevated border border-border
                    rounded-lg text-text-secondary hover:text-text-primary hover:border-border-hover
                    transition-colors duration-150 disabled:opacity-50"
                  data-testid="load-more"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Map: full remaining space */}
        <div className="flex-1 relative">
          <SpotsMap
            spots={filteredSpots}
            userLocation={userLocation}
            selectedSpotId={selectedSpotId}
            onSelectSpot={setSelectedSpotId}
            onBoundsChange={handleBoundsChange}
            onViewportChange={handleViewportChange}
            initialBounds={urlState.bounds}
            initialCenter={urlState.mapCenter}
            initialZoom={urlState.mapZoom}
          />

          {/* Mobile: search overlay on top of map (hidden in TWA) */}
          {!isTWA && (
            <div className="md:hidden absolute top-0 left-0 right-0 z-10 p-3 space-y-2">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
          )}

          {/* Mobile spot preview (hidden in TWA) */}
          {!isTWA && selectedSpotId && (() => {
            const previewSpot = filteredSpots.find((s) => s.id === selectedSpotId);
            return previewSpot ? (
              <SpotPreview spot={previewSpot} onClose={() => setSelectedSpotId(null)} />
            ) : null;
          })()}
        </div>

        {/* Mobile bottom sheet (hidden in TWA) */}
        {!isTWA && <BottomSheet spotCount={filteredSpots.length}>
          <SpotsList
            spots={filteredSpots}
            selectedSpotId={selectedSpotId}
            onSelectSpot={setSelectedSpotId}
            loading={spotsLoading}
            error={spotsError}
          />
          {hasMore && !spotsLoading && (
            <div className="mt-4 mb-4 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2 text-sm font-medium bg-elevated border border-border
                  rounded-lg text-text-secondary hover:text-text-primary transition-colors duration-150
                  disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </BottomSheet>}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-app">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
