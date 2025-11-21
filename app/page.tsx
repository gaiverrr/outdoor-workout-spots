"use client";

import { useState } from "react";
import { SpotsMap } from "@/components/Map/SpotsMap";
import { SpotsList } from "@/components/Spots/SpotsList";
import { SearchBar } from "@/components/Search/SearchBar";
import { QuickFilters } from "@/components/Search/QuickFilters";
import { useSpots } from "@/hooks/useSpots";
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

  // Fetch data
  const { spots, loading: spotsLoading, error: spotsError } = useSpots();
  const { location: userLocation, status: locationStatus } = useUserLocation();

  // Calculate distances and apply filters
  const spotsWithDistance = useSpotsWithDistance({ spots, userLocation });
  const filteredSpots = useFilteredSpots({
    spots: spotsWithDistance,
    searchQuery,
    filters,
  });

  return (
    <div className="flex-1 flex flex-col">
      {/* Search Bar Section */}
      <section className="bg-surface border-b border-neon-magenta/20 p-4">
        <div className="container mx-auto">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </section>

      {/* Quick Filters */}
      <section className="bg-surface border-b border-neon-magenta/20 p-4">
        <div className="container mx-auto">
          <QuickFilters filters={filters} onChange={setFilters} />
        </div>
      </section>

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

      {/* Map Section */}
      <section className="h-[50vh] bg-elevated border-b border-neon-cyan/20 relative overflow-hidden">
        <SpotsMap
          spots={filteredSpots}
          userLocation={userLocation}
          selectedSpotId={selectedSpotId}
          onSelectSpot={setSelectedSpotId}
        />
      </section>

      {/* Spots List Section */}
      <section className="flex-1 overflow-y-auto bg-app p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-text-primary">
              <span className="text-glow-magenta">
                {userLocation ? "Nearby Spots" : "All Spots"}
              </span>
            </h2>
            <span className="text-sm font-mono text-text-secondary">
              {filteredSpots.length} {filteredSpots.length === 1 ? "spot" : "spots"}
            </span>
          </div>

          <SpotsList
            spots={filteredSpots}
            selectedSpotId={selectedSpotId}
            onSelectSpot={setSelectedSpotId}
            loading={spotsLoading}
            error={spotsError}
          />
        </div>
      </section>
    </div>
  );
}
