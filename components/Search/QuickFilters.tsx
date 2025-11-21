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
    <div className="flex items-center gap-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
        {FILTER_BUTTONS.map(({ key, label, emoji }) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all
              whitespace-nowrap flex items-center gap-2
              ${
                filters[key]
                  ? "bg-neon-magenta/20 border-2 border-neon-magenta text-neon-magenta border-glow-magenta"
                  : "bg-elevated border border-neon-magenta/40 text-text-primary hover:bg-neon-magenta/10 hover:border-neon-magenta"
              }
            `}
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {activeCount > 0 && (
        <button
          onClick={() =>
            onChange({
              hasBars: false,
              hasRings: false,
              hasTrack: false,
            })
          }
          className="flex-shrink-0 px-3 py-2 text-sm text-text-dim hover:text-text-primary transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
