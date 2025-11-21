"use client";

import type { SpotWithDistance } from "@/hooks/useSpotsWithDistance";
import { motion } from "framer-motion";
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
      <div className="space-y-4 md:space-y-5 lg:space-y-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="glass p-4 md:p-5 lg:p-6 rounded-xl border border-neon-cyan/20 animate-pulse"
          >
            <div className="h-6 md:h-7 bg-elevated rounded w-3/4 mb-3" />
            <div className="h-4 md:h-5 bg-elevated rounded w-full mb-4" />
            <div className="flex gap-2 md:gap-3">
              <div className="h-7 md:h-8 bg-elevated rounded-full w-20 md:w-24" />
              <div className="h-7 md:h-8 bg-elevated rounded-full w-24 md:w-28" />
              <div className="h-7 md:h-8 bg-elevated rounded-full w-16 md:w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass p-8 md:p-10 lg:p-12 rounded-xl border border-red-500/30 text-center">
        <div className="text-5xl md:text-6xl mb-4">⚠️</div>
        <p className="text-red-400 text-lg md:text-xl font-medium mb-3">Failed to load spots</p>
        <p className="text-text-dim text-sm md:text-base">{error}</p>
      </div>
    );
  }

  if (spots.length === 0) {
    return (
      <div className="glass p-8 md:p-12 lg:p-16 rounded-xl border border-neon-cyan/20 text-center">
        <div className="text-6xl md:text-7xl lg:text-8xl mb-6">🔍</div>
        <p className="text-text-secondary text-lg md:text-xl font-medium mb-3">No spots found</p>
        <p className="text-text-dim text-sm md:text-base">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4 md:space-y-5 lg:space-y-6"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
      initial="hidden"
      animate="show"
    >
      {spots.map((spot) => (
        <motion.div
          key={spot.id}
          variants={{
            hidden: { opacity: 0, y: 50 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
          }}
        >
          <SpotCard
            spot={spot}
            isSelected={spot.id === selectedSpotId}
            onClick={() => onSelectSpot?.(spot.id)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
