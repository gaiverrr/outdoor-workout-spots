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
  // Show more equipment on larger screens
  const equipment = spot.details?.equipment || [];
  const equipmentToShow = equipment.slice(0, 5);
  const hasMoreEquipment = equipment.length > 5;

  return (
    <Link
      href={`/spots/${spot.id}`}
      className={`
        group relative block glass p-4 md:p-5 lg:p-6 rounded-xl border h-full
        transition-all duration-200 ease-out
        hover:scale-[1.02] hover:-translate-y-2
        hover:shadow-[0_20px_60px_-15px_rgba(34,211,238,0.4),0_0_40px_rgba(34,211,238,0.3)]
        active:scale-[0.98] active:translate-y-0
        ${isSelected
          ? "border-neon-magenta border-glow-magenta bg-neon-magenta/5"
          : "border-neon-cyan/20 hover:border-neon-cyan hover:bg-neon-cyan/5"
        }
      `}
      onClick={onClick}
    >
      {/* Animated gradient overlay on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-neon-purple/10 to-neon-magenta/10 animate-gradient" />
      </div>

      {/* Shimmer effect */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Content wrapper with relative positioning */}
      <div className="relative z-10">
        {/* Header: Title and Distance */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl font-bold text-text-primary truncate mb-1">
              {spot.title}
            </h3>
            {spot.name && spot.name !== spot.title && (
              <p className="text-xs md:text-sm text-text-dim truncate">{spot.name}</p>
            )}
          </div>

          {/* Distance badge */}
          {spot.distanceKm != null && (
            <div className="flex-shrink-0">
              <span
                className={`
                px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm font-mono font-bold
                ${isSelected
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
          <p className="text-text-secondary text-sm md:text-base mb-4 line-clamp-2 md:line-clamp-1 lg:line-clamp-2">
            {spot.address}
          </p>
        )}

        {/* Equipment chips - responsive grid */}
        {equipmentToShow.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {equipmentToShow.map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="px-2.5 py-1.5 md:px-3 md:py-2 bg-neon-purple/10 border border-neon-purple/30 rounded-full text-xs md:text-sm text-neon-purple font-medium"
              >
                {item}
              </span>
            ))}
            {hasMoreEquipment && (
              <span className="px-2.5 py-1.5 md:px-3 md:py-2 text-xs md:text-sm text-text-dim font-medium">
                +{equipment.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Rating indicator */}
        {spot.details?.rating != null && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 md:h-2.5 bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-neon-horizontal transition-all duration-500 group-hover:animate-pulse"
                style={{ width: `${spot.details.rating}%` }}
              />
            </div>
            <span className="text-xs md:text-sm font-mono text-text-secondary font-bold group-hover:text-neon-cyan transition-colors duration-300">
              {spot.details.rating}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
