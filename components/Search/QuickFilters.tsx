"use client";

import type { FilterOptions } from "@/hooks/useFilteredSpots";

export interface QuickFiltersProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

interface FilterButton {
  key: keyof FilterOptions;
  label: string;
  emoji: string;
}

const FILTER_BUTTONS: FilterButton[] = [
  { key: "hasBars", label: "Pull-Up Bars", emoji: "🏋️" },
  { key: "hasRings", label: "Rings", emoji: "💍" },
  { key: "hasTrack", label: "Track", emoji: "🏃" },
];

export function QuickFilters({ filters, onChange }: QuickFiltersProps) {
  const toggleFilter = (key: keyof FilterOptions) => {
    onChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex items-center gap-3 md:gap-4">
      {/* Active filters indicator on desktop */}
      {activeCount > 0 && (
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-neon-magenta/10 border border-neon-magenta/30 rounded-lg">
          <span className="text-sm font-mono text-neon-magenta font-bold">
            {activeCount}
          </span>
          <span className="text-xs text-text-secondary">
            {activeCount === 1 ? "filter" : "filters"}
          </span>
        </div>
      )}

      {/* Filter buttons */}
      <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide flex-1">
        {FILTER_BUTTONS.map(({ key, label, emoji }) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className={`
              px-4 py-2 md:px-5 md:py-2.5 lg:px-6 lg:py-3 rounded-full
              text-sm md:text-base font-medium transition-all duration-300
              whitespace-nowrap flex items-center gap-2 md:gap-2.5
              ${
                filters[key]
                  ? "bg-neon-magenta/20 border-2 border-neon-magenta text-neon-magenta border-glow-magenta scale-105"
                  : "bg-elevated border border-neon-magenta/40 text-text-primary hover:bg-neon-magenta/10 hover:border-neon-magenta hover:scale-105"
              }
            `}
          >
            <span className="text-base md:text-lg">{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Clear button */}
      {activeCount > 0 && (
        <button
          onClick={() =>
            onChange({
              hasBars: false,
              hasRings: false,
              hasTrack: false,
            })
          }
          className="flex-shrink-0 px-3 py-2 md:px-4 md:py-2.5 text-sm md:text-base font-medium
                     text-text-dim hover:text-neon-magenta hover:bg-neon-magenta/10
                     rounded-lg transition-all duration-300 border border-transparent hover:border-neon-magenta/40"
        >
          Clear
        </button>
      )}
    </div>
  );
}
