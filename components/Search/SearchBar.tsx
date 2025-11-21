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
      <div className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-text-dim text-lg md:text-xl pointer-events-none">
        🔍
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full px-4 py-3 md:px-5 md:py-4 pl-12 md:pl-14 bg-elevated border-2 border-neon-cyan/30
          rounded-xl text-base md:text-lg text-text-primary placeholder:text-text-dim
          focus:outline-none focus:border-neon-cyan focus:border-glow-cyan
          transition-all duration-300
          font-medium
        "
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2
                     text-text-dim hover:text-neon-magenta transition-all duration-300
                     text-lg md:text-xl hover:scale-110"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
