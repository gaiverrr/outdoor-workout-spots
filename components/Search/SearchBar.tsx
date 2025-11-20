"use client";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search by city or address...",
}: SearchBarProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim text-lg pointer-events-none">
        🔍
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full px-4 py-3 pl-12 bg-elevated border border-neon-cyan/30
          rounded-lg text-text-primary placeholder:text-text-dim
          focus:outline-none focus:border-neon-cyan focus:border-glow-cyan
          transition-all
        "
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary transition-colors"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
