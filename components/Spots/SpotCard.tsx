"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { SpotWithDistance } from "@/hooks/useSpotsWithDistance";
import { formatDistance } from "@/lib/distance";
import { useReducedMotion } from "@/hooks/useReducedMotion";

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
  const prefersReducedMotion = useReducedMotion();

  // Wrapper component - either motion.div or regular div based on user preference
  const Wrapper = prefersReducedMotion ? 'div' : motion.div;
  const wrapperProps = prefersReducedMotion
    ? { className: "h-full" }
    : {
        whileHover: { scale: 1.05, rotate: 2 },
        whileTap: { scale: 0.95, rotate: -2 },
        transition: { type: "spring", stiffness: 400, damping: 17 },
        className: "h-full"
      };

  return (
    <Wrapper {...wrapperProps}>
      <Link
        href={`/spots/${spot.id}`}
        className={`
          block glass p-4 md:p-5 lg:p-6 rounded-xl border transition-colors duration-300 h-full
          ${isSelected
            ? "border-neon-magenta border-glow-magenta bg-neon-magenta/5"
            : "border-neon-cyan/20 hover:border-neon-cyan/40"
          }
        `}
        onClick={onClick}
      >
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
                className="h-full bg-gradient-neon-horizontal transition-all duration-500"
                style={{ width: `${spot.details.rating}%` }}
              />
            </div>
            <span className="text-xs md:text-sm font-mono text-text-secondary font-bold">
              {spot.details.rating}
            </span>
          </div>
        )}
      </Link>
    </Wrapper>
  );
}
