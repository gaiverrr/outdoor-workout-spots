"use client";

import type { SpotWithDistance } from "@/hooks/useSpotsWithDistance";
import { SpotCard } from "./SpotCard";

interface SpotsListProps {
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
      <div className="space-y-3" data-testid="spots-loading">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-surface border border-border rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12" data-testid="spots-error">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (spots.length === 0) {
    return (
      <div className="text-center py-12" data-testid="spots-empty">
        <p className="text-text-dim text-sm">No spots found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="spots-list">
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
