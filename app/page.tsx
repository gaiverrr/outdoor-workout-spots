"use client";

import { useState } from "react";
import { SpotsMap } from "@/components/Map/SpotsMap";
import { SpotsList } from "@/components/Spots/SpotsList";
import { SearchBar } from "@/components/Search/SearchBar";
import { QuickFilters } from "@/components/Search/QuickFilters";
import { useSpotsPaginated } from "@/hooks/useSpotsPaginated";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useSpotsWithDistance } from "@/hooks/useSpotsWithDistance";
import { useFilteredSpots } from "@/hooks/useFilteredSpots";
import type { FilterOptions } from "@/hooks/useFilteredSpots";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    hasBars: false,
    hasRings: false,
    hasTrack: false,
  });
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);

  // Fetch data with pagination
  const {
    spots,
    loading: spotsLoading,
    error: spotsError,
    hasMore,
    total,
    loadMore,
  } = useSpotsPaginated(100, searchQuery);
  const { location: userLocation, status: locationStatus } = useUserLocation();

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
                  className="px-8 py-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg text-neon-cyan hover:bg-neon-cyan/20 hover:border-neon-cyan/50 transition-all font-mono font-semibold shadow-glow-cyan"
                >
                  Load More Spots ({filteredSpots.length} / {total})
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
