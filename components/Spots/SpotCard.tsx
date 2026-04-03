"use client";

import Link from "next/link";
import type { SpotWithDistance } from "@/hooks/useSpotsWithDistance";
import { formatDistance } from "@/lib/distance";

export interface SpotCardProps {
  spot: SpotWithDistance;
  isSelected?: boolean;
  onClick?: () => void;
}

export function SpotCard({ spot, isSelected, onClick }: SpotCardProps) {
  const equipment = spot.details?.equipment || [];
  const equipmentToShow = equipment.slice(0, 4);
  const hasMoreEquipment = equipment.length > 4;

  return (
    <Link
      href={`/spots/${spot.id}`}
      className={`block p-4 rounded-xl border transition-colors duration-150
        ${isSelected
          ? "bg-accent/10 border-accent"
          : "bg-surface border-border hover:border-border-hover"
        }`}
      onClick={onClick}
      data-testid={`spot-card-${spot.id}`}
    >
      {/* Title + Distance */}
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-text-primary truncate">
            {spot.title}
          </h3>
          {spot.name && spot.name !== spot.title && (
            <p className="text-xs text-text-dim truncate mt-0.5">{spot.name}</p>
          )}
        </div>
        {spot.distanceKm != null && (
          <span className="flex-shrink-0 px-2 py-1 rounded-md text-xs font-semibold bg-accent-secondary/15 text-accent-secondary">
            {formatDistance(spot.distanceKm)}
          </span>
        )}
      </div>

      {/* Address */}
      {spot.address && (
        <p className="text-sm text-text-secondary mb-3 line-clamp-1">{spot.address}</p>
      )}

      {/* Equipment chips */}
      {equipmentToShow.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-2">
          {equipmentToShow.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="px-2 py-1 bg-elevated border border-border rounded-md text-xs text-text-secondary"
            >
              {item}
            </span>
          ))}
          {hasMoreEquipment && (
            <span className="px-2 py-1 text-xs text-text-dim">
              +{equipment.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Rating */}
      {spot.details?.rating != null && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full"
              style={{ width: `${spot.details.rating}%` }}
            />
          </div>
          <span className="text-xs text-text-dim font-medium">
            {spot.details.rating}
          </span>
        </div>
      )}
    </Link>
  );
}
