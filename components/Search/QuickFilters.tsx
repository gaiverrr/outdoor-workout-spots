"use client";

import type { FilterOptions } from "@/hooks/useFilteredSpots";

interface QuickFiltersProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

const FILTER_OPTIONS = [
  { key: "hasBars" as const, label: "Pull-Up Bars", icon: "💪" },
  { key: "hasRings" as const, label: "Rings", icon: "🔗" },
  { key: "hasTrack" as const, label: "Track", icon: "🏃" },
];

export function QuickFilters({ filters, onChange }: QuickFiltersProps) {
  const activeCount = Object.values(filters).filter(Boolean).length;

  const toggleFilter = (key: keyof FilterOptions) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  const clearAll = () => {
    onChange({ hasBars: false, hasRings: false, hasTrack: false });
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide" data-testid="quick-filters">
      {FILTER_OPTIONS.map(({ key, label, icon }) => {
        const isActive = filters[key];
        return (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
              whitespace-nowrap transition-colors duration-150
              ${isActive
                ? "bg-accent text-white"
                : "bg-surface border border-border text-text-secondary hover:border-border-hover hover:text-text-primary"
              }`}
            data-testid={`filter-${key}`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        );
      })}

      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className="px-3 py-2 text-sm text-text-dim hover:text-text-secondary transition-colors duration-150 whitespace-nowrap"
          data-testid="filter-clear"
        >
          Clear ({activeCount})
        </button>
      )}
    </div>
  );
}
