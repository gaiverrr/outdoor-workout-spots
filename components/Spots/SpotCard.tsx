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
  const equipment = spot.details?.equipment.slice(0, 3) || [];

  return (
    <Link
      href={`/spots/${spot.id}`}
      className={`
        block glass p-4 rounded-xl border transition-all duration-300
        card-tilt hover:scale-[1.02] cursor-pointer
        ${
          isSelected
            ? "border-neon-magenta border-glow-magenta bg-neon-magenta/5"
            : "border-neon-cyan/20 hover:border-neon-cyan/40"
        }
      `}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="text-lg font-bold text-text-primary truncate mb-1">
            {spot.title}
          </h3>
          {spot.name && spot.name !== spot.title && (
            <p className="text-xs text-text-dim truncate">{spot.name}</p>
          )}
        </div>

        {/* Distance badge */}
        {spot.distanceKm != null && (
          <div className="flex-shrink-0">
            <span
              className={`
              px-2 py-1 rounded text-xs font-mono font-bold
              ${
                isSelected
                  ? "bg-neon-magenta/30 border border-neon-magenta text-neon-magenta"
                  : "bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan"
              }
            `}
            >
              {formatDistance(spot.distanceKm)}
            </span>
          </div>
        )}
      </div>

      {/* Address */}
      {spot.address && (
        <p className="text-text-secondary text-sm mb-3 line-clamp-2">
          {spot.address}
        </p>
      )}

      {/* Equipment chips */}
      {equipment.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {equipment.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="px-2 py-1 bg-neon-purple/10 border border-neon-purple/30 rounded-full text-xs text-neon-purple"
            >
              {item}
            </span>
          ))}
          {(spot.details?.equipment.length || 0) > 3 && (
            <span className="px-2 py-1 text-xs text-text-dim">
              +{(spot.details?.equipment.length || 0) - 3} more
            </span>
          )}
        </div>
      )}

      {/* Rating indicator */}
      {spot.details?.rating != null && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-neon-horizontal"
              style={{ width: `${spot.details.rating}%` }}
            />
          </div>
          <span className="text-xs font-mono text-text-secondary">
            {spot.details.rating}
          </span>
        </div>
      )}
    </Link>
  );
}
