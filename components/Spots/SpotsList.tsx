"use client";

import type { SpotWithDistance } from "@/hooks/useSpotsWithDistance";
import { SpotCard } from "./SpotCard";

export interface SpotsListProps {
  spots: SpotWithDistance[];
  selectedSpotId?: number | null;
  onSelectSpot?: (spotId: number) => void;
  loading?: boolean;
  error?: string | null;
}

export function SpotsList({
  spots,
  selectedSpotId,
  onSelectSpot,
  loading,
  error,
}: SpotsListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glass p-4 rounded-xl border border-neon-cyan/20 animate-pulse"
          >
            <div className="h-6 bg-elevated rounded w-3/4 mb-2" />
            <div className="h-4 bg-elevated rounded w-full mb-3" />
            <div className="flex gap-2">
              <div className="h-6 bg-elevated rounded-full w-20" />
              <div className="h-6 bg-elevated rounded-full w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass p-6 rounded-xl border border-red-500/30 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-400 font-medium mb-2">Failed to load spots</p>
        <p className="text-text-dim text-sm">{error}</p>
      </div>
    );
  }

  if (spots.length === 0) {
    return (
      <div className="glass p-8 rounded-xl border border-neon-cyan/20 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-text-secondary font-medium mb-2">No spots found</p>
        <p className="text-text-dim text-sm">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {spots.map((spot) => (
        <SpotCard
          key={spot.id}
          spot={spot}
          isSelected={spot.id === selectedSpotId}
          onClick={() => onSelectSpot?.(spot.id)}
        />
      ))}
    </div>
  );
}
