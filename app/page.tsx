"use client";

import { useState, useCallback, useRef, useEffect, useMemo, Suspense } from "react";
import { SpotsMap, type MapBounds } from "@/components/Map/SpotsMap";
import { SpotsList } from "@/components/Spots/SpotsList";
import { SearchBar } from "@/components/Search/SearchBar";
import { QuickFilters } from "@/components/Search/QuickFilters";
import { useSpotsInfinite } from "@/hooks/useSpotsInfinite";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useSpotsWithDistance } from "@/hooks/useSpotsWithDistance";
import { useFilteredSpots } from "@/hooks/useFilteredSpots";
import { useUrlState } from "@/hooks/useUrlState";
import type { FilterOptions } from "@/hooks/useFilteredSpots";

function HomeContent() {
  const { getInitialState, updateUrl } = useUrlState();

  // Initialize state from URL or defaults
  const initialState = useMemo(() => getInitialState(), [getInitialState]);

  const [searchQuery, setSearchQuery] = useState(initialState.searchQuery || "");
  const [filters, setFilters] = useState<FilterOptions>(
    initialState.filters || {
      hasBars: false,
      hasRings: false,
      hasTrack: false,
    }
  );
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(
    initialState.selectedSpotId || null
  );
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(
    initialState.bounds || null
  );

  // Debounce timer ref and flags for first bounds update
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstBoundsUpdate = useRef(true);
  const boundsFromUrl = useRef(!!initialState.bounds); // Track if bounds came from URL

  const { location: userLocation, status: locationStatus } = useUserLocation();

  // Debounced bounds update handler (immediate first time, 500ms delay after)
  const handleBoundsChange = useCallback((bounds: MapBounds | null) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If bounds came from URL, skip the first update from map to avoid overwriting
    if (boundsFromUrl.current) {
      boundsFromUrl.current = false;
      isFirstBoundsUpdate.current = false;
      return;
    }

    // First update is immediate, subsequent updates are debounced
    if (isFirstBoundsUpdate.current) {
      isFirstBoundsUpdate.current = false;
      setMapBounds(bounds);
    } else {
      // Set new timer for subsequent updates
      debounceTimerRef.current = setTimeout(() => {
        setMapBounds(bounds);
      }, 500);
    }
  }, []);

  // Sync state to URL when it changes
  useEffect(() => {
    updateUrl(
      {
        bounds: mapBounds,
        searchQuery,
        filters,
        selectedSpotId,
      },
      false // debounced for map bounds
    );
  }, [mapBounds, searchQuery, filters, selectedSpotId, updateUrl]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Fetch data with infinite scroll and viewport filtering
  const {
    spots,
    loading: spotsLoading,
    loadingMore,
    error: spotsError,
    hasMore,
    total,
    loadMore,
  } = useSpotsInfinite({ limit: 100, searchQuery, bounds: mapBounds });

  // Calculate distances and apply filters
  const spotsWithDistance = useSpotsWithDistance({ spots, userLocation });
  const filteredSpots = useFilteredSpots({
    spots: spotsWithDistance,
    searchQuery,
    filters,
  });

  return (
    <div className="h-full grid grid-rows-[auto_1fr]">
      {/* Header: Search Bar, Filters, Status - Auto height */}
      <header className="bg-surface border-b border-neon-magenta/20">
        {/* Search Bar Section */}
        <div className="border-b border-neon-magenta/20 p-4">
          <div className="container mx-auto max-w-7xl">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="border-b border-neon-magenta/20 p-4">
          <div className="container mx-auto max-w-7xl">
            <QuickFilters filters={filters} onChange={setFilters} />
          </div>
        </div>

        {/* Location Status Banner */}
        {locationStatus === "loading" && (
          <div className="bg-neon-cyan/10 border-b border-neon-cyan/30 px-4 py-2">
            <p className="text-sm text-neon-cyan text-center font-mono">
              📍 Getting your location...
            </p>
          </div>
        )}
        {locationStatus === "denied" && (
          <div className="bg-neon-magenta/10 border-b border-neon-magenta/30 px-4 py-2">
            <p className="text-sm text-neon-magenta text-center font-mono">
              ⚠️ Location access denied - showing all spots
            </p>
          </div>
        )}
      </header>

      {/* Main Content: Responsive Grid Layout - Takes remaining 1fr height */}
      {/* Mobile: Stacked vertically with natural scroll (map 50vh, list below) */}
      {/* Tablet/Desktop: Side-by-side with fixed map and scrollable list */}
      <div className="overflow-y-auto md:overflow-hidden flex flex-col md:grid md:grid-cols-2 lg:grid-cols-[3fr_2fr] xl:grid-cols-[11fr_9fr]">
        {/* Map Section - 50vh on mobile, full height on desktop */}
        <section className="h-[50vh] md:h-full flex-shrink-0 bg-elevated border-b md:border-b-0 md:border-r border-neon-cyan/20 relative overflow-hidden">
          <SpotsMap
            spots={filteredSpots}
            userLocation={userLocation}
            selectedSpotId={selectedSpotId}
            onSelectSpot={setSelectedSpotId}
            onBoundsChange={handleBoundsChange}
            initialBounds={initialState.bounds}
          />
        </section>

        {/* Spots List Section - Flows naturally on mobile, scrollable column on desktop */}
        <section className="flex-shrink-0 md:h-full md:overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
                <span className="text-glow-magenta">
                  {userLocation ? "Nearby Spots" : "All Spots"}
                </span>
              </h2>
              <span className="text-sm md:text-base font-mono text-text-secondary">
                {filteredSpots.length} of {total} {total === 1 ? "spot" : "spots"}
              </span>
            </div>

            <SpotsList
              spots={filteredSpots}
              selectedSpotId={selectedSpotId}
              onSelectSpot={setSelectedSpotId}
              loading={spotsLoading}
              error={spotsError}
            />

            {/* Load More Button */}
            {hasMore && !spotsLoading && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg text-neon-cyan hover:bg-neon-cyan/20 hover:border-neon-cyan/50 transition-all font-mono font-semibold shadow-glow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? "Loading..." : `Load More Spots (${filteredSpots.length} / ${total})`}
                </button>
              </div>
            )}

            {!hasMore && filteredSpots.length > 0 && (
              <div className="mt-8 text-center text-text-secondary font-mono text-sm">
                All spots loaded ({total} total)
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
