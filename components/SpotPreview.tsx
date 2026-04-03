"use client";

import Link from "next/link";
import type { SpotWithDistance } from "@/hooks/useSpotsWithDistance";
import { formatDistance } from "@/lib/distance";

interface SpotPreviewProps {
  spot: SpotWithDistance;
  onClose: () => void;
}

export function SpotPreview({ spot, onClose }: SpotPreviewProps) {
  const firstImage = spot.details?.images?.[0];

  return (
    <div
      className="md:hidden fixed bottom-20 inset-x-3 z-30 bg-surface border border-border rounded-xl shadow-lg
        animate-[slideUp_200ms_ease-out]"
      data-testid="spot-preview"
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center
          rounded-full bg-elevated text-text-dim hover:text-text-primary transition-colors"
        aria-label="Close preview"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex gap-3 p-3">
        {firstImage && (
          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-elevated">
            <img
              src={firstImage}
              alt={spot.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate mb-1">
            {spot.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
            {spot.distanceKm != null && (
              <span className="text-accent-secondary font-medium">
                {formatDistance(spot.distanceKm)}
              </span>
            )}
            {spot.details?.rating != null && (
              <span>Rating: {spot.details.rating}</span>
            )}
          </div>
          <Link
            href={`/spots/${spot.id}`}
            className="inline-block text-xs font-medium px-3 py-1.5 bg-accent text-white rounded-lg
              hover:bg-accent-hover transition-colors duration-150"
            data-testid="preview-view-details"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
