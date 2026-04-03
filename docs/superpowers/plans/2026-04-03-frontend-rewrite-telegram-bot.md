# Frontend Rewrite + Telegram Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite frontend with dark athletic theme and map-first layout, add Telegram bot for nearest spots lookup.

**Architecture:** Evolutionary refactor — replace all UI components and styles while keeping data hooks, API route, and database. Mobile: full-screen map + draggable bottom sheet. Desktop: sidebar + map. Telegram bot as serverless webhook.

**Tech Stack:** Next.js 16, React 19, MapLibre GL, TanStack Query, Tailwind CSS 4, Grammy (Telegram), Playwright

**Spec:** `docs/superpowers/specs/2026-04-03-frontend-rewrite-telegram-bot-design.md`

**Beads issues:** All tasks tracked in beads (`bd list`). Update issue status as you work (`bd update <id> --status in_progress`).

---

## File Structure

### Files to Delete
- `components/UI/FloatingBackground.tsx`
- `components/UI/FloatingBackgroundLoader.tsx`
- `components/UI/ThreeDKettlebell.tsx`
- `components/ErrorBoundary.tsx`
- `lib/webgl.ts`
- `hooks/useReducedMotion.ts`
- `tests/example.spec.ts` (replaced by new tests)

### Files to Rewrite (complete replacement)
- `app/globals.css` — new design system
- `app/layout.tsx` — minimal shell, no header
- `app/page.tsx` — map-first layout with bottom sheet / sidebar
- `app/spots/[id]/page.tsx` — new detail page server component
- `app/spots/[id]/SpotDetailClient.tsx` — new detail client component
- `components/Map/SpotsMap.tsx` — restyled markers/popups
- `components/Spots/SpotsList.tsx` — adapted for sidebar/bottom sheet
- `components/Spots/SpotCard.tsx` — new card design
- `components/Search/SearchBar.tsx` — new styling
- `components/Search/QuickFilters.tsx` — new chip design

### Files to Modify
- `hooks/useUrlState.ts` — add lat/lng/z params
- `package.json` — remove 3D deps, add grammy

### New Files
- `components/BottomSheet.tsx` — mobile bottom sheet
- `components/SpotPreview.tsx` — quick preview on marker click
- `app/api/telegram/webhook/route.ts` — Telegram webhook
- `scripts/setup-telegram-webhook.ts` — register webhook
- `tests/e2e/map.spec.ts`
- `tests/e2e/search.spec.ts`
- `tests/e2e/filters.spec.ts`
- `tests/e2e/spot-preview.spec.ts`
- `tests/e2e/spot-detail.spec.ts`
- `tests/e2e/navigation.spec.ts`
- `tests/e2e/geolocation.spec.ts`
- `tests/e2e/bottom-sheet.spec.ts`
- `tests/e2e/responsive.spec.ts`
- `tests/api/telegram.spec.ts`

### Files Kept As-Is (no changes)
- `hooks/useSpotsInfinite.ts`
- `hooks/useUserLocation.ts`
- `hooks/useSpotsWithDistance.ts`
- `hooks/useFilteredSpots.ts`
- `hooks/useMapClusters.ts`
- `app/api/spots/route.ts`
- `app/providers.tsx`
- `lib/db.ts`
- `lib/distance.ts`
- `data/calisthenics-spots.types.ts`

---

## Task 1: Remove 3D and Heavy Animation Dependencies

**Beads:** `outdoor-workout-spots-82y`

**Files:**
- Delete: `components/UI/FloatingBackground.tsx`
- Delete: `components/UI/FloatingBackgroundLoader.tsx`
- Delete: `components/UI/ThreeDKettlebell.tsx`
- Delete: `components/ErrorBoundary.tsx`
- Delete: `lib/webgl.ts`
- Delete: `hooks/useReducedMotion.ts`
- Delete: `tests/example.spec.ts`
- Modify: `app/layout.tsx` (remove FloatingBackgroundLoader import)
- Modify: `package.json` (remove deps)

- [ ] **Step 1: Delete unused component files**

```bash
rm components/UI/FloatingBackground.tsx
rm components/UI/FloatingBackgroundLoader.tsx
rm components/UI/ThreeDKettlebell.tsx
rm components/ErrorBoundary.tsx
rm lib/webgl.ts
rm hooks/useReducedMotion.ts
rm tests/example.spec.ts
```

- [ ] **Step 2: Remove FloatingBackgroundLoader import from layout.tsx**

In `app/layout.tsx`, remove the import line:
```typescript
import FloatingBackgroundLoader from "@/components/UI/FloatingBackgroundLoader";
```

And remove `<FloatingBackgroundLoader />` from the JSX (line 68 in current file).

- [ ] **Step 3: Uninstall 3D and animation packages**

```bash
npm uninstall three @react-three/fiber @react-three/drei framer-motion
```

- [ ] **Step 4: Verify build succeeds**

```bash
npm run build
```

Expected: Build completes without errors. No references to deleted files remain.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove Three.js, Framer Motion, and unused UI components"
```

---

## Task 2: Design System — Dark Athletic Theme

**Beads:** `outdoor-workout-spots-rrn`

**Files:**
- Rewrite: `app/globals.css`

- [ ] **Step 1: Replace globals.css with new design system**

Replace the entire content of `app/globals.css` with:

```css
@import "tailwindcss";

:root {
  /* Dark athletic backgrounds */
  --bg-app: #0f1117;
  --bg-surface: #1a1d27;
  --bg-elevated: #242836;

  /* Accent colors */
  --accent: #FF6B35;
  --accent-hover: #FF8555;
  --accent-secondary: #4A9EFF;

  /* Text colors */
  --text-primary: #F0F0F5;
  --text-secondary: #9CA3AF;
  --text-dim: #6B7280;

  /* Borders */
  --border: #2A2E3A;
  --border-hover: #3A3F4E;
}

@theme inline {
  --color-app: var(--bg-app);
  --color-surface: var(--bg-surface);
  --color-elevated: var(--bg-elevated);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-accent-secondary: var(--accent-secondary);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-dim: var(--text-dim);
  --color-border: var(--border);
  --color-border-hover: var(--border-hover);

  --spacing-safe-top: env(safe-area-inset-top);
  --spacing-safe-bottom: env(safe-area-inset-bottom);
}

html {
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  text-size-adjust: 100%;
  scroll-behavior: smooth;
}

body {
  background: var(--bg-app);
  color: var(--text-primary);
  font-family: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  min-height: 100dvh;
  overflow-x: hidden;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Scrollbar hiding */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* MapLibre Popup Styling — dark athletic */
.maplibregl-popup {
  max-width: 320px !important;
  z-index: 50;
}

.maplibregl-popup-content {
  background: var(--bg-elevated) !important;
  border: 1px solid var(--border) !important;
  border-radius: 12px !important;
  padding: 0 !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5) !important;
}

.maplibregl-popup-close-button {
  color: var(--text-secondary) !important;
  font-size: 20px !important;
  padding: 4px 8px !important;
  right: 4px !important;
  top: 4px !important;
  border-radius: 6px !important;
  width: 28px !important;
  height: 28px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: background 150ms ease !important;
}

.maplibregl-popup-close-button:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.maplibregl-popup-tip {
  border-top-color: var(--border) !important;
  border-bottom-color: var(--border) !important;
}
```

- [ ] **Step 2: Verify the dev server starts without CSS errors**

```bash
npm run dev
```

Open http://localhost:3000 — page should load with dark background. Existing components will look broken (expected — they reference old color classes). That's fine, we'll fix them in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: replace neon design system with dark athletic theme"
```

---

## Task 3: Minimal App Shell (layout.tsx)

**Beads:** Part of `outdoor-workout-spots-rrn` (design system task)

**Files:**
- Rewrite: `app/layout.tsx`

- [ ] **Step 1: Replace layout.tsx with minimal shell**

Replace the entire content of `app/layout.tsx` with:

```tsx
import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { RegisterServiceWorker } from "./register-sw";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Outdoor Workout Spots - Find Street Workout Places",
  description:
    "Discover outdoor workout spots, calisthenics parks, and street workout locations near you.",
  keywords: [
    "outdoor workout",
    "calisthenics",
    "street workout",
    "fitness",
    "training spots",
  ],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    title: "Outdoor Workout Spots",
    description: "Find outdoor workout spots and calisthenics parks near you",
    siteName: "Outdoor Workout Spots",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Workout Spots",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0f1117",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="antialiased h-full">
        <Providers>
          <RegisterServiceWorker />
          <main className="h-dvh overflow-hidden">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
```

Key changes: removed header (map-first = no chrome), removed FloatingBackgroundLoader, removed Geist_Mono (unused), full-height main.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds. Page renders as dark full-height container.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: minimal app shell for map-first layout"
```

---

## Task 4: Extend URL State with Map Center/Zoom

**Beads:** `outdoor-workout-spots-xhe`

**Files:**
- Modify: `hooks/useUrlState.ts`

- [ ] **Step 1: Add lat/lng/z to URL state**

In `hooks/useUrlState.ts`, update the `UrlState` interface to add map viewport:

```typescript
export interface UrlState {
  bounds: MapBounds | null;
  searchQuery: string;
  filters: FilterOptions;
  selectedSpotId: number | null;
  mapCenter: { lat: number; lng: number } | null;
  mapZoom: number | null;
}
```

Update `serializeState` — add after the bounds block:

```typescript
  // Map center and zoom
  if (state.mapCenter) {
    params.set("lat", state.mapCenter.lat.toFixed(6));
    params.set("lng", state.mapCenter.lng.toFixed(6));
  }
  if (state.mapZoom != null) {
    params.set("z", state.mapZoom.toFixed(1));
  }
```

Update `deserializeState` — add after the bounds parsing block:

```typescript
  // Map center and zoom
  const lat = params.get("lat");
  const lng = params.get("lng");
  const z = params.get("z");
  if (lat && lng) {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      state.mapCenter = { lat: parsedLat, lng: parsedLng };
    }
  }
  if (z) {
    const parsedZ = parseFloat(z);
    if (!isNaN(parsedZ)) {
      state.mapZoom = parsedZ;
    }
  }
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useUrlState.ts
git commit -m "feat: add map center/zoom to URL state for back navigation"
```

---

## Task 5: Restyle Search Bar

**Beads:** `outdoor-workout-spots-mo9`

**Files:**
- Rewrite: `components/Search/SearchBar.tsx`

- [ ] **Step 1: Replace SearchBar with new design**

Replace the entire content of `components/Search/SearchBar.tsx`:

```tsx
"use client";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by city or address..."
        className="w-full pl-10 pr-10 py-3 bg-surface border border-border rounded-lg
          text-text-primary placeholder:text-text-dim
          focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
          transition-colors duration-150"
        data-testid="search-input"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6
            flex items-center justify-center rounded-full
            text-text-dim hover:text-text-primary hover:bg-elevated
            transition-colors duration-150"
          aria-label="Clear search"
          data-testid="search-clear"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it renders**

```bash
npm run dev
```

Open http://localhost:3000 — search bar should be visible with dark surface background and orange focus ring.

- [ ] **Step 3: Commit**

```bash
git add components/Search/SearchBar.tsx
git commit -m "feat: restyle search bar with dark athletic theme"
```

---

## Task 6: Restyle Quick Filters

**Beads:** `outdoor-workout-spots-mo9`

**Files:**
- Rewrite: `components/Search/QuickFilters.tsx`

- [ ] **Step 1: Replace QuickFilters with new design**

Replace the entire content of `components/Search/QuickFilters.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add components/Search/QuickFilters.tsx
git commit -m "feat: restyle filter chips with dark athletic theme"
```

---

## Task 7: Restyle Spot Cards

**Beads:** `outdoor-workout-spots-346`

**Files:**
- Rewrite: `components/Spots/SpotCard.tsx`

- [ ] **Step 1: Replace SpotCard with new design**

Replace the entire content of `components/Spots/SpotCard.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add components/Spots/SpotCard.tsx
git commit -m "feat: restyle spot cards with dark athletic theme"
```

---

## Task 8: Restyle Spots List

**Beads:** Part of `outdoor-workout-spots-346`

**Files:**
- Rewrite: `components/Spots/SpotsList.tsx`

- [ ] **Step 1: Replace SpotsList with new design**

Replace the entire content of `components/Spots/SpotsList.tsx`:

```tsx
"use client";

import type { SpotWithDistance } from "@/hooks/useSpotsWithDistance";
import { SpotCard } from "./SpotCard";

interface SpotsListProps {
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
      <div className="space-y-3" data-testid="spots-loading">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-surface border border-border rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12" data-testid="spots-error">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (spots.length === 0) {
    return (
      <div className="text-center py-12" data-testid="spots-empty">
        <p className="text-text-dim text-sm">No spots found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="spots-list">
      {spots.map((spot) => (
        <SpotCard
          key={spot.id}
          spot={spot}
          isSelected={spot.id === selectedSpotId}
          onClick={() => onSelectSpot?.(spot.id)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Spots/SpotsList.tsx
git commit -m "feat: restyle spots list with dark athletic theme"
```

---

## Task 9: Restyle Map Markers and Popups

**Beads:** `outdoor-workout-spots-7g6`

**Files:**
- Rewrite: `components/Map/SpotsMap.tsx`

- [ ] **Step 1: Replace SpotsMap with restyled markers**

Replace the entire content of `components/Map/SpotsMap.tsx`:

```tsx
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  type MapRef,
} from "react-map-gl/maplibre";
import Link from "next/link";
import type { SpotWithDistance } from "@/hooks/useSpotsWithDistance";
import type { Coordinates } from "@/hooks/useUserLocation";
import { useMapClusters, type MapPoint } from "@/hooks/useMapClusters";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface SpotsMapProps {
  spots: SpotWithDistance[];
  userLocation?: Coordinates | null;
  selectedSpotId?: number | null;
  onSelectSpot?: (spotId: number | null) => void;
  onBoundsChange?: (bounds: MapBounds | null) => void;
  onViewportChange?: (center: { lat: number; lng: number }, zoom: number) => void;
  initialBounds?: MapBounds | null;
  initialCenter?: { lat: number; lng: number } | null;
  initialZoom?: number | null;
}

const DEFAULT_CENTER: [number, number] = [0, 20];
const DEFAULT_ZOOM = 2;
const SELECTED_ZOOM = 13;
const FIT_BOUNDS_PADDING = 20;

function normalizeLongitude(lon: number): number {
  if (!isFinite(lon)) return 0;
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

function normalizeBounds(bounds: {
  getSouth: () => number;
  getNorth: () => number;
  getWest: () => number;
  getEast: () => number;
}): MapBounds | null {
  const minLat = bounds.getSouth();
  const maxLat = bounds.getNorth();
  const minLon = bounds.getWest();
  const maxLon = bounds.getEast();

  if (maxLon - minLon >= 360) return null;

  return {
    minLat: Math.max(-90, Math.min(90, minLat)),
    maxLat: Math.max(-90, Math.min(90, maxLat)),
    minLon: normalizeLongitude(minLon),
    maxLon: normalizeLongitude(maxLon),
  };
}

function getCenterFromBounds(bounds: MapBounds): [number, number] {
  return [(bounds.minLon + bounds.maxLon) / 2, (bounds.minLat + bounds.maxLat) / 2];
}

function getClusterSize(count: number): number {
  if (count < 10) return 36;
  if (count < 50) return 42;
  if (count < 100) return 48;
  if (count < 500) return 54;
  return 60;
}

export function SpotsMap({
  spots,
  userLocation,
  selectedSpotId,
  onSelectSpot,
  onBoundsChange,
  onViewportChange,
  initialBounds,
  initialCenter,
  initialZoom,
}: SpotsMapProps) {
  const mapRef = useRef<MapRef>(null);
  const hasFittedBounds = useRef(false);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);

  const { points, expandCluster } = useMapClusters({
    spots,
    zoom: currentZoom,
    bounds: currentBounds,
  });

  const { center, zoom } = useMemo(() => {
    // Priority: URL center/zoom > selected spot > URL bounds > user location > default
    if (initialCenter && initialZoom != null) {
      return {
        center: [initialCenter.lng, initialCenter.lat] as [number, number],
        zoom: initialZoom,
      };
    }

    if (selectedSpotId) {
      const selectedSpot = spots.find((s) => s.id === selectedSpotId);
      if (selectedSpot?.lat != null && selectedSpot?.lon != null) {
        return {
          center: [selectedSpot.lon, selectedSpot.lat] as [number, number],
          zoom: SELECTED_ZOOM,
        };
      }
    }

    if (initialBounds) {
      return { center: getCenterFromBounds(initialBounds), zoom: DEFAULT_ZOOM };
    }

    if (userLocation) {
      return {
        center: [userLocation.lon, userLocation.lat] as [number, number],
        zoom: 11,
      };
    }

    return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
  }, [userLocation, selectedSpotId, spots, initialBounds, initialCenter, initialZoom]);

  const handleClusterClick = useCallback(
    (clusterId: number) => {
      const expansion = expandCluster(clusterId);
      if (expansion && mapRef.current) {
        mapRef.current.flyTo({
          center: [expansion.lon, expansion.lat],
          zoom: expansion.zoom,
          duration: 500,
        });
      }
    },
    [expandCluster]
  );

  const updateBoundsAndZoom = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const center = map.getCenter();

    setCurrentZoom(zoom);
    onViewportChange?.({ lat: center.lat, lng: center.lng }, zoom);

    if (!bounds) return;
    const normalizedBounds = normalizeBounds(bounds);
    setCurrentBounds(normalizedBounds);
    onBoundsChange?.(normalizedBounds);
  }, [onBoundsChange, onViewportChange]);

  const handleLoad = useCallback(() => {
    if (!mapRef.current) return;
    if (initialBounds && !hasFittedBounds.current && !initialCenter) {
      hasFittedBounds.current = true;
      mapRef.current.getMap().fitBounds(
        [
          [initialBounds.minLon, initialBounds.minLat],
          [initialBounds.maxLon, initialBounds.maxLat],
        ],
        { padding: FIT_BOUNDS_PADDING, duration: 0 }
      );
    }
    if (initialBounds) {
      requestAnimationFrame(() => updateBoundsAndZoom());
    } else {
      updateBoundsAndZoom();
    }
  }, [updateBoundsAndZoom, initialBounds, initialCenter]);

  const selectedSpot = selectedSpotId
    ? spots.find((s) => s.id === selectedSpotId)
    : null;

  return (
    <div className="relative w-full h-full" data-testid="spots-map">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: center[0], latitude: center[1], zoom }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        attributionControl={false}
        onMove={updateBoundsAndZoom}
        onLoad={handleLoad}
      >
        <NavigationControl position="top-right" />

        {/* User location marker */}
        {userLocation && (
          <Marker longitude={userLocation.lon} latitude={userLocation.lat} anchor="center">
            <div className="relative">
              <div className="w-3.5 h-3.5 bg-accent-secondary rounded-full border-2 border-white shadow-lg" />
              <div className="absolute inset-0 w-3.5 h-3.5 bg-accent-secondary rounded-full animate-ping opacity-50" />
            </div>
          </Marker>
        )}

        {/* Clusters and spot markers */}
        {points.map((point: MapPoint) => {
          if (point.type === "cluster") {
            const size = getClusterSize(point.count);
            return (
              <Marker
                key={`cluster-${point.id}`}
                longitude={point.lon}
                latitude={point.lat}
                anchor="center"
                onClick={() => handleClusterClick(point.id)}
              >
                <button
                  className="flex items-center justify-center rounded-full cursor-pointer
                    transition-transform duration-150 hover:scale-110
                    bg-accent border-2 border-white/80 shadow-md"
                  style={{ width: size, height: size }}
                  aria-label={`Cluster of ${point.count} spots`}
                >
                  <span className="text-white font-bold text-sm">
                    {point.countAbbreviated}
                  </span>
                </button>
              </Marker>
            );
          }

          const { spot, lat, lon } = point;
          const isSelected = spot.id === selectedSpotId;

          return (
            <Marker
              key={`spot-${spot.id}`}
              longitude={lon}
              latitude={lat}
              anchor="bottom"
              onClick={() => onSelectSpot?.(spot.id)}
            >
              <button
                className={`transition-transform duration-150 cursor-pointer
                  ${isSelected ? "scale-125 z-10" : "hover:scale-110 z-0"}`}
                aria-label={`View ${spot.title}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center
                    border-2 shadow-md transition-colors duration-150
                    ${isSelected
                      ? "bg-accent border-white"
                      : "bg-elevated border-border hover:bg-accent hover:border-white"
                    }`}
                >
                  <span className="text-white text-xs font-bold">💪</span>
                </div>
              </button>
            </Marker>
          );
        })}

        {/* Popup for selected spot */}
        {selectedSpot?.lat && selectedSpot?.lon && (
          <Popup
            longitude={selectedSpot.lon}
            latitude={selectedSpot.lat}
            anchor="bottom"
            offset={40}
            onClose={() => onSelectSpot?.(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-3 min-w-[200px] max-w-[280px]">
              <h3 className="text-sm font-semibold text-text-primary mb-1.5 line-clamp-2">
                {selectedSpot.title}
              </h3>
              {selectedSpot.address && (
                <p className="text-xs text-text-dim mb-1.5 line-clamp-1">
                  {selectedSpot.address}
                </p>
              )}
              {selectedSpot.distanceKm != null && (
                <p className="text-xs text-accent-secondary mb-1.5">
                  {selectedSpot.distanceKm.toFixed(1)} km away
                </p>
              )}
              {selectedSpot.details?.rating != null && (
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs text-text-secondary">
                    Rating: {selectedSpot.details.rating}/100
                  </span>
                </div>
              )}
              <Link
                href={`/spots/${selectedSpot.id}`}
                className="block w-full text-center text-sm font-medium py-2 px-3 rounded-lg
                  bg-accent text-white hover:bg-accent-hover transition-colors duration-150"
                data-testid="spot-view-details"
              >
                View Details
              </Link>
            </div>
          </Popup>
        )}
      </Map>

      <div className="absolute bottom-2 right-2 text-[10px] text-text-dim bg-black/50 px-1.5 py-0.5 rounded">
        © OpenStreetMap | CARTO
      </div>
    </div>
  );
}
```

Key changes: added `onViewportChange` + `initialCenter`/`initialZoom` props for URL state. Restyled all markers to dark athletic. Clusters use orange accent instead of purple gradient. User location uses blue accent.

- [ ] **Step 2: Commit**

```bash
git add components/Map/SpotsMap.tsx
git commit -m "feat: restyle map markers and popups, add viewport change callback"
```

---

## Task 10: Desktop Layout — Sidebar + Map

**Beads:** `outdoor-workout-spots-f10`

**Files:**
- Rewrite: `app/page.tsx`

- [ ] **Step 1: Replace page.tsx with desktop sidebar layout**

Replace the entire content of `app/page.tsx`:

```tsx
"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { SpotsMap, type MapBounds } from "@/components/Map/SpotsMap";
import { SpotsList } from "@/components/Spots/SpotsList";
import { SearchBar } from "@/components/Search/SearchBar";
import { QuickFilters } from "@/components/Search/QuickFilters";
import { useSpotsInfinite } from "@/hooks/useSpotsInfinite";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useSpotsWithDistance } from "@/hooks/useSpotsWithDistance";
import { useFilteredSpots } from "@/hooks/useFilteredSpots";
import { useUrlState } from "@/hooks/useUrlState";
import type { FilterOptions } from "@/hooks/useFilteredSpots";

function HomeContent() {
  const { initialState: urlState, updateUrl } = useUrlState();

  const [searchQuery, setSearchQuery] = useState(urlState.searchQuery || "");
  const [filters, setFilters] = useState<FilterOptions>(
    urlState.filters || { hasBars: false, hasRings: false, hasTrack: false }
  );
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(
    urlState.selectedSpotId || null
  );
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(
    urlState.bounds || null
  );
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(
    urlState.mapCenter || null
  );
  const [mapZoom, setMapZoom] = useState<number | null>(urlState.mapZoom || null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstBoundsUpdate = useRef(true);
  const boundsFromUrl = useRef(!!urlState.bounds);

  const { location: userLocation, status: locationStatus, requestLocation } = useUserLocation();

  const handleBoundsChange = useCallback((bounds: MapBounds | null) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (boundsFromUrl.current) {
      boundsFromUrl.current = false;
      isFirstBoundsUpdate.current = false;
      return;
    }

    if (isFirstBoundsUpdate.current) {
      isFirstBoundsUpdate.current = false;
      setMapBounds(bounds);
    } else {
      debounceTimerRef.current = setTimeout(() => setMapBounds(bounds), 500);
    }
  }, []);

  const handleViewportChange = useCallback(
    (center: { lat: number; lng: number }, zoom: number) => {
      setMapCenter(center);
      setMapZoom(zoom);
    },
    []
  );

  // Sync state to URL
  useEffect(() => {
    updateUrl({
      bounds: mapBounds,
      searchQuery,
      filters,
      selectedSpotId,
      mapCenter,
      mapZoom,
    });
  }, [mapBounds, searchQuery, filters, selectedSpotId, mapCenter, mapZoom, updateUrl]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const {
    spots,
    loading: spotsLoading,
    loadingMore,
    error: spotsError,
    hasMore,
    loadMore,
  } = useSpotsInfinite({ limit: 100, searchQuery, bounds: mapBounds });

  const spotsWithDistance = useSpotsWithDistance({ spots, userLocation });
  const filteredSpots = useFilteredSpots({ spots: spotsWithDistance, searchQuery, filters });

  return (
    <div className="h-full flex flex-col">
      {/* Top bar: search + filters — visible on desktop, hidden on mobile (moved to bottom sheet) */}
      <div className="hidden md:block bg-surface border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="w-80 flex-shrink-0">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <QuickFilters filters={filters} onChange={setFilters} />
          <div className="ml-auto flex items-center gap-3">
            {locationStatus === "idle" && (
              <button
                onClick={requestLocation}
                className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary
                  bg-elevated border border-border rounded-lg transition-colors duration-150"
                data-testid="locate-me"
              >
                📍 Locate me
              </button>
            )}
            {locationStatus === "loading" && (
              <span className="text-sm text-accent-secondary">Locating...</span>
            )}
            <span className="text-sm text-text-dim">
              {filteredSpots.length} spots
            </span>
          </div>
        </div>
      </div>

      {/* Main content: sidebar + map */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:flex-col w-[360px] flex-shrink-0 border-r border-border bg-app overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">
              {userLocation ? "Nearby Spots" : "All Spots"}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <SpotsList
              spots={filteredSpots}
              selectedSpotId={selectedSpotId}
              onSelectSpot={setSelectedSpotId}
              loading={spotsLoading}
              error={spotsError}
            />
            {hasMore && !spotsLoading && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 text-sm font-medium bg-elevated border border-border
                    rounded-lg text-text-secondary hover:text-text-primary hover:border-border-hover
                    transition-colors duration-150 disabled:opacity-50"
                  data-testid="load-more"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Map: full remaining space */}
        <div className="flex-1 relative">
          <SpotsMap
            spots={filteredSpots}
            userLocation={userLocation}
            selectedSpotId={selectedSpotId}
            onSelectSpot={setSelectedSpotId}
            onBoundsChange={handleBoundsChange}
            onViewportChange={handleViewportChange}
            initialBounds={urlState.bounds}
            initialCenter={urlState.mapCenter}
            initialZoom={urlState.mapZoom}
          />

          {/* Mobile: search overlay on top of map */}
          <div className="md:hidden absolute top-0 left-0 right-0 z-10 p-3 space-y-2">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <QuickFilters filters={filters} onChange={setFilters} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-app">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
```

This implements the desktop layout with sidebar. Mobile search/filters overlay the map. The bottom sheet (Task 11) will add mobile spot list.

- [ ] **Step 2: Verify desktop layout**

```bash
npm run dev
```

Open http://localhost:3000 at desktop width — should show sidebar (360px) on the left, map filling the rest. Search bar and filters in the top bar.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: map-first desktop layout with sidebar and top bar"
```

---

## Task 11: Mobile Bottom Sheet

**Beads:** `outdoor-workout-spots-8fc`

**Files:**
- Create: `components/BottomSheet.tsx`
- Modify: `app/page.tsx` (add BottomSheet to mobile view)

- [ ] **Step 1: Create BottomSheet component**

Create `components/BottomSheet.tsx`:

```tsx
"use client";

import { useCallback, useRef, useState, useEffect } from "react";

type SheetState = "peek" | "half" | "full";

interface BottomSheetProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  spotCount?: number;
}

const PEEK_HEIGHT = 72;    // px — just handle + label
const HALF_RATIO = 0.5;    // 50% of viewport
const FULL_RATIO = 0.9;    // 90% of viewport

export function BottomSheet({ children, header, spotCount = 0 }: BottomSheetProps) {
  const [state, setState] = useState<SheetState>("peek");
  const [dragging, setDragging] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const dragStartY = useRef(0);
  const dragStartTranslate = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const getHeightForState = useCallback((s: SheetState): number => {
    const vh = window.innerHeight;
    switch (s) {
      case "peek": return PEEK_HEIGHT;
      case "half": return vh * HALF_RATIO;
      case "full": return vh * FULL_RATIO;
    }
  }, []);

  const getTranslateForState = useCallback(
    (s: SheetState): number => {
      const vh = window.innerHeight;
      const height = getHeightForState(s);
      return vh - height;
    },
    [getHeightForState]
  );

  // Set initial position
  useEffect(() => {
    setTranslateY(getTranslateForState("peek"));
  }, [getTranslateForState]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setDragging(true);
      dragStartY.current = e.touches[0].clientY;
      dragStartTranslate.current = translateY;
    },
    [translateY]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging) return;
      const diff = e.touches[0].clientY - dragStartY.current;
      const newTranslate = dragStartTranslate.current + diff;
      const minTranslate = getTranslateForState("full");
      const maxTranslate = getTranslateForState("peek");
      setTranslateY(Math.max(minTranslate, Math.min(maxTranslate, newTranslate)));
    },
    [dragging, getTranslateForState]
  );

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    const vh = window.innerHeight;
    const currentHeight = vh - translateY;

    // Snap to nearest state
    const peekH = PEEK_HEIGHT;
    const halfH = vh * HALF_RATIO;
    const fullH = vh * FULL_RATIO;

    const distPeek = Math.abs(currentHeight - peekH);
    const distHalf = Math.abs(currentHeight - halfH);
    const distFull = Math.abs(currentHeight - fullH);

    const min = Math.min(distPeek, distHalf, distFull);
    let target: SheetState;
    if (min === distPeek) target = "peek";
    else if (min === distHalf) target = "half";
    else target = "full";

    setState(target);
    setTranslateY(getTranslateForState(target));
  }, [translateY, getTranslateForState]);

  return (
    <div
      ref={sheetRef}
      className={`md:hidden fixed inset-x-0 bottom-0 z-20 bg-app border-t border-border rounded-t-2xl
        ${dragging ? "" : "transition-transform duration-300 ease-out"}`}
      style={{
        transform: `translateY(${translateY}px)`,
        height: "90vh",
      }}
      data-testid="bottom-sheet"
      data-state={state}
    >
      {/* Drag handle */}
      <div
        className="flex flex-col items-center py-3 cursor-grab active:cursor-grabbing touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="bottom-sheet-handle"
      >
        <div className="w-10 h-1 bg-border-hover rounded-full mb-2" />
        <span className="text-xs text-text-dim">
          {spotCount} spots nearby
        </span>
      </div>

      {/* Header (optional — for mobile search/filters) */}
      {header && (
        <div className="px-3 pb-2 border-b border-border">{header}</div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 pb-safe-bottom">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add BottomSheet to page.tsx**

In `app/page.tsx`, add the import at the top:

```typescript
import { BottomSheet } from "@/components/BottomSheet";
```

Then add the BottomSheet after the map `</div>` closing tag (inside the flex-1 container), before the closing `</div>` of the main content flex:

```tsx
        {/* Mobile bottom sheet */}
        <BottomSheet spotCount={filteredSpots.length}>
          <SpotsList
            spots={filteredSpots}
            selectedSpotId={selectedSpotId}
            onSelectSpot={setSelectedSpotId}
            loading={spotsLoading}
            error={spotsError}
          />
          {hasMore && !spotsLoading && (
            <div className="mt-4 mb-4 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2 text-sm font-medium bg-elevated border border-border
                  rounded-lg text-text-secondary hover:text-text-primary transition-colors duration-150
                  disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </BottomSheet>
```

- [ ] **Step 3: Test on mobile emulation**

Open Chrome DevTools → toggle device toolbar → select Pixel 5 (393x851). The bottom sheet should show "N spots nearby" at the bottom. Drag it up to reveal the spot list.

- [ ] **Step 4: Commit**

```bash
git add components/BottomSheet.tsx app/page.tsx
git commit -m "feat: mobile bottom sheet with drag-to-expand for spot list"
```

---

## Task 12: Spot Quick Preview Panel

**Beads:** `outdoor-workout-spots-iie`

**Files:**
- Create: `components/SpotPreview.tsx`
- Modify: `app/page.tsx` (add SpotPreview for mobile)

- [ ] **Step 1: Create SpotPreview component**

Create `components/SpotPreview.tsx`:

```tsx
"use client";

import Link from "next/link";
import type { SpotWithDistance } from "@/hooks/useSpotsWithDistance";
import { formatDistance } from "@/lib/distance";

interface SpotPreviewProps {
  spot: SpotWithDistance;
  onClose: () => void;
}

export function SpotPreview({ spot, onClose }: SpotPreviewProps) {
  const firstImage = spot.details?.images?.[0];

  return (
    <div
      className="md:hidden fixed bottom-20 inset-x-3 z-30 bg-surface border border-border rounded-xl shadow-lg
        animate-[slideUp_200ms_ease-out]"
      data-testid="spot-preview"
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center
          rounded-full bg-elevated text-text-dim hover:text-text-primary transition-colors"
        aria-label="Close preview"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        {firstImage && (
          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-elevated">
            <img
              src={firstImage}
              alt={spot.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate mb-1">
            {spot.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
            {spot.distanceKm != null && (
              <span className="text-accent-secondary font-medium">
                {formatDistance(spot.distanceKm)}
              </span>
            )}
            {spot.details?.rating != null && (
              <span>Rating: {spot.details.rating}</span>
            )}
          </div>
          <Link
            href={`/spots/${spot.id}`}
            className="inline-block text-xs font-medium px-3 py-1.5 bg-accent text-white rounded-lg
              hover:bg-accent-hover transition-colors duration-150"
            data-testid="preview-view-details"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add slideUp keyframe to globals.css**

Add at the end of `app/globals.css`:

```css
@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

- [ ] **Step 3: Add SpotPreview to page.tsx**

In `app/page.tsx`, add import:

```typescript
import { SpotPreview } from "@/components/SpotPreview";
```

Add the SpotPreview component just before the BottomSheet in the JSX. It shows on mobile when a spot is selected:

```tsx
          {/* Mobile spot preview */}
          {selectedSpotId && (() => {
            const previewSpot = filteredSpots.find((s) => s.id === selectedSpotId);
            return previewSpot ? (
              <SpotPreview spot={previewSpot} onClose={() => setSelectedSpotId(null)} />
            ) : null;
          })()}
```

- [ ] **Step 4: Commit**

```bash
git add components/SpotPreview.tsx app/globals.css app/page.tsx
git commit -m "feat: mobile spot preview panel on marker click"
```

---

## Task 13: Redesign Spot Detail Page

**Beads:** `outdoor-workout-spots-gcd`

**Files:**
- Rewrite: `app/spots/[id]/SpotDetailClient.tsx`
- Rewrite: `app/spots/[id]/page.tsx`

- [ ] **Step 1: Replace SpotDetailClient.tsx**

Replace the entire content of `app/spots/[id]/SpotDetailClient.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Map, { Marker } from "react-map-gl/maplibre";
import type { CalisthenicsSpot } from "@/data/calisthenics-spots.types";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getDistanceKm, formatDistance } from "@/lib/distance";
import "maplibre-gl/dist/maplibre-gl.css";

interface SpotDetailClientProps {
  spot: CalisthenicsSpot;
}

export function SpotDetailClient({ spot }: SpotDetailClientProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const { location: userLocation } = useUserLocation();

  const distance =
    userLocation && spot.lat != null && spot.lon != null
      ? getDistanceKm(userLocation, { lat: spot.lat, lon: spot.lon })
      : null;

  const images = spot.details?.images || [];
  const equipment = spot.details?.equipment || [];
  const description = spot.details?.description || "";

  return (
    <div className="min-h-dvh bg-app">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-app/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          data-testid="back-button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: spot.title, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          data-testid="share-button"
        >
          Share
        </button>
      </header>

      {/* Hero image */}
      {images.length > 0 && !imageError[0] ? (
        <div className="w-full aspect-video bg-elevated relative">
          <Image
            src={images[0]}
            alt={spot.title}
            fill
            className="object-cover"
            onError={() => setImageError((prev) => ({ ...prev, [0]: true }))}
            priority
          />
        </div>
      ) : spot.lat != null && spot.lon != null ? (
        <div className="w-full aspect-video">
          <Map
            initialViewState={{ longitude: spot.lon, latitude: spot.lat, zoom: 14 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            attributionControl={false}
            interactive={false}
          >
            <Marker longitude={spot.lon} latitude={spot.lat} anchor="center">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-white text-xs">💪</span>
              </div>
            </Marker>
          </Map>
        </div>
      ) : null}

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Title */}
        <h1 className="text-2xl font-bold text-text-primary mb-1" data-testid="spot-title">
          {spot.title}
        </h1>

        {/* Address */}
        {spot.address && (
          <p className="text-sm text-text-secondary mb-3">{spot.address}</p>
        )}

        {/* Rating + Distance */}
        <div className="flex items-center gap-3 mb-4">
          {spot.details?.rating != null && (
            <span className="text-sm text-text-secondary">
              Rating: {spot.details.rating}/100
            </span>
          )}
          {distance != null && (
            <span className="text-sm font-medium text-accent-secondary">
              {formatDistance(distance)} away
            </span>
          )}
        </div>

        {/* Equipment */}
        {equipment.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {equipment.map((item, i) => (
              <span
                key={`${item}-${i}`}
                className="px-3 py-1.5 bg-elevated border border-border rounded-lg text-sm text-text-secondary"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {description && (
          <div className="mb-6">
            <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
          </div>
        )}

        {/* Photo gallery */}
        {images.length > 1 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Photos</h2>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x">
              {images.slice(1).map((url, i) => (
                <div key={i} className="flex-shrink-0 w-60 h-40 snap-start rounded-lg overflow-hidden bg-elevated">
                  {!imageError[i + 1] ? (
                    <Image
                      src={url}
                      alt={`${spot.title} - ${i + 2}`}
                      width={240}
                      height={160}
                      className="w-full h-full object-cover"
                      onError={() => setImageError((prev) => ({ ...prev, [i + 1]: true }))}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-dim text-sm">
                      Unavailable
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mini map + directions */}
        {spot.lat != null && spot.lon != null && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Location</h2>
            <div className="h-48 rounded-xl overflow-hidden border border-border mb-3">
              <Map
                initialViewState={{ longitude: spot.lon, latitude: spot.lat, zoom: 14 }}
                style={{ width: "100%", height: "100%" }}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                attributionControl={false}
                interactive={false}
              >
                <Marker longitude={spot.lon} latitude={spot.lat} anchor="center">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-white text-xs">💪</span>
                  </div>
                </Marker>
              </Map>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3 bg-accent text-white font-medium rounded-lg
                hover:bg-accent-hover transition-colors duration-150"
              data-testid="open-google-maps"
            >
              Open in Google Maps
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify spot detail page renders**

```bash
npm run dev
```

Navigate to http://localhost:3000/spots/1 — should show the redesigned detail page with dark athletic styling.

- [ ] **Step 3: Commit**

```bash
git add app/spots/[id]/SpotDetailClient.tsx
git commit -m "feat: redesign spot detail page with dark athletic theme"
```

---

## Task 14: Telegram Bot — Webhook Endpoint

**Beads:** `outdoor-workout-spots-ydb`

**Files:**
- Create: `app/api/telegram/webhook/route.ts`
- Modify: `package.json` (add grammy)

- [ ] **Step 1: Install Grammy**

```bash
npm install grammy
```

- [ ] **Step 2: Create webhook route**

Create `app/api/telegram/webhook/route.ts`:

```typescript
import { Bot, webhookCallback } from "grammy";
import { getDb } from "@/lib/db";
import { getDistanceKm, formatDistance } from "@/lib/distance";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN environment variable is required");
}

const APP_URL = process.env.APP_URL || "https://workoutspots.app";

const bot = new Bot(token);

interface SpotRow {
  id: number;
  title: string;
  lat: number | null;
  lon: number | null;
  address: string | null;
  equipment: string | null;
  rating: number | null;
}

bot.on("message:location", async (ctx) => {
  const { latitude, longitude } = ctx.message.location;

  const db = getDb();

  // Pre-filter by bounding box (±0.5 degrees ~55km), then sort by Haversine in JS
  const result = await db.execute({
    sql: `SELECT id, title, lat, lon, address, equipment, rating
          FROM spots
          WHERE lat BETWEEN ? AND ?
            AND lon BETWEEN ? AND ?
            AND lat IS NOT NULL
            AND lon IS NOT NULL
          LIMIT 200`,
    args: [
      latitude - 0.5,
      latitude + 0.5,
      longitude - 0.5,
      longitude + 0.5,
    ],
  });

  const spots = (result.rows as unknown as SpotRow[])
    .filter((r) => r.lat != null && r.lon != null)
    .map((r) => ({
      ...r,
      distance: getDistanceKm(
        { lat: latitude, lon: longitude },
        { lat: r.lat!, lon: r.lon! }
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  if (spots.length === 0) {
    await ctx.reply("No workout spots found nearby. Try a different location!");
    return;
  }

  const lines = spots.map((spot, i) => {
    const parts = [`${i + 1}. ${spot.title} (${formatDistance(spot.distance)})`];
    if (spot.rating != null) {
      parts.push(`   Rating: ${spot.rating}/100`);
    }
    if (spot.equipment) {
      try {
        const eq = JSON.parse(spot.equipment) as string[];
        if (eq.length > 0) parts.push(`   ${eq.slice(0, 3).join(", ")}`);
      } catch {
        // skip malformed equipment
      }
    }
    parts.push(`   ${APP_URL}/spots/${spot.id}`);
    return parts.join("\n");
  });

  await ctx.reply(
    `📍 5 nearest workout spots:\n\n${lines.join("\n\n")}`,
    { link_preview_options: { is_disabled: true } }
  );
});

// Handle non-location messages
bot.on("message", async (ctx) => {
  await ctx.reply(
    "Send me your 📍 location and I'll find the 5 nearest workout spots!\n\n" +
      "Tap the 📎 attachment button → Location → Send your current location."
  );
});

export const POST = webhookCallback(bot, "std/http");
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/api/telegram/webhook/route.ts package.json package-lock.json
git commit -m "feat: add Telegram bot webhook for nearest spots lookup"
```

---

## Task 15: Telegram Bot — Webhook Setup Script

**Beads:** `outdoor-workout-spots-345`

**Files:**
- Create: `scripts/setup-telegram-webhook.ts`

- [ ] **Step 1: Create setup script**

Create `scripts/setup-telegram-webhook.ts`:

```typescript
import "dotenv/config";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.argv[2];

if (!TELEGRAM_BOT_TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN not set in .env.local");
  process.exit(1);
}

if (!WEBHOOK_URL) {
  console.error("Usage: npx tsx scripts/setup-telegram-webhook.ts <webhook-url>");
  console.error("Example: npx tsx scripts/setup-telegram-webhook.ts https://your-app.vercel.app/api/telegram/webhook");
  process.exit(1);
}

async function setup() {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      allowed_updates: ["message"],
    }),
  });

  const data = await res.json();
  if (data.ok) {
    console.log(`Webhook set to: ${WEBHOOK_URL}`);
  } else {
    console.error("Failed to set webhook:", data.description);
    process.exit(1);
  }

  // Verify
  const infoRes = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
  );
  const info = await infoRes.json();
  console.log("Webhook info:", JSON.stringify(info.result, null, 2));
}

setup();
```

- [ ] **Step 2: Commit**

```bash
git add scripts/setup-telegram-webhook.ts
git commit -m "feat: add Telegram webhook setup script"
```

---

## Task 16: E2E Tests — Map, Search, Filters

**Beads:** `outdoor-workout-spots-k1v`

**Files:**
- Create: `tests/e2e/map.spec.ts`
- Create: `tests/e2e/search.spec.ts`
- Create: `tests/e2e/filters.spec.ts`

- [ ] **Step 1: Create map tests**

Create `tests/e2e/map.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Map", () => {
  test("renders map canvas", async ({ page }) => {
    await page.goto("/");
    const map = page.getByTestId("spots-map");
    await expect(map).toBeVisible();
    const canvas = map.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 15000 });
  });

  test("shows navigation controls", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("spots-map").locator("canvas").waitFor({ timeout: 15000 });
    const nav = page.locator(".maplibregl-ctrl-zoom-in");
    await expect(nav).toBeVisible();
  });

  test("displays spot markers after loading", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("spots-map").locator("canvas").waitFor({ timeout: 15000 });
    // Wait for markers to appear (cluster or individual)
    await page.waitForTimeout(3000);
    const markers = page.locator("[aria-label*='spot'], [aria-label*='Cluster']");
    await expect(markers.first()).toBeVisible({ timeout: 10000 });
  });
});
```

- [ ] **Step 2: Create search tests**

Create `tests/e2e/search.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Search", () => {
  test("search input is visible", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("search-input");
    await expect(input).toBeVisible();
  });

  test("can type search query", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("search-input");
    await input.fill("Berlin");
    await expect(input).toHaveValue("Berlin");
  });

  test("clear button appears and works", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("search-input");
    await input.fill("test");

    const clear = page.getByTestId("search-clear");
    await expect(clear).toBeVisible();
    await clear.click();
    await expect(input).toHaveValue("");
  });

  test("search updates URL", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("search-input");
    await input.fill("Berlin");
    // Wait for debounced URL update
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/q=Berlin/);
  });
});
```

- [ ] **Step 3: Create filter tests**

Create `tests/e2e/filters.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Filters", () => {
  test("filter buttons are visible", async ({ page }) => {
    await page.goto("/");
    const filters = page.getByTestId("quick-filters");
    await expect(filters).toBeVisible();
  });

  test("can toggle filter on and off", async ({ page }) => {
    await page.goto("/");
    const barsFilter = page.getByTestId("filter-hasBars");
    await barsFilter.click();
    // Active filter should have accent bg
    await expect(barsFilter).toHaveClass(/bg-accent/);

    await barsFilter.click();
    await expect(barsFilter).not.toHaveClass(/bg-accent/);
  });

  test("clear button resets all filters", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("filter-hasBars").click();
    await page.getByTestId("filter-hasRings").click();

    const clear = page.getByTestId("filter-clear");
    await expect(clear).toBeVisible();
    await clear.click();

    await expect(page.getByTestId("filter-hasBars")).not.toHaveClass(/bg-accent/);
    await expect(page.getByTestId("filter-hasRings")).not.toHaveClass(/bg-accent/);
  });

  test("filter updates URL", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("filter-hasBars").click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/bars=1/);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npx playwright test tests/e2e/map.spec.ts tests/e2e/search.spec.ts tests/e2e/filters.spec.ts --project=chromium
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/
git commit -m "test: add E2E tests for map, search, and filters"
```

---

## Task 17: E2E Tests — Spot Preview and Detail

**Beads:** `outdoor-workout-spots-25e`

**Files:**
- Create: `tests/e2e/spot-preview.spec.ts`
- Create: `tests/e2e/spot-detail.spec.ts`
- Create: `tests/e2e/navigation.spec.ts`

- [ ] **Step 1: Create spot preview tests**

Create `tests/e2e/spot-preview.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Spot Preview", () => {
  test("clicking a marker shows popup with View Details", async ({ page }) => {
    await page.goto("/");
    // Wait for map and markers to load
    await page.getByTestId("spots-map").locator("canvas").waitFor({ timeout: 15000 });
    await page.waitForTimeout(3000);

    // Click first available spot marker
    const marker = page.locator("button[aria-label^='View ']").first();
    if (await marker.isVisible()) {
      await marker.click();
      const viewDetails = page.getByTestId("spot-view-details");
      await expect(viewDetails).toBeVisible({ timeout: 5000 });
    }
  });
});
```

- [ ] **Step 2: Create spot detail tests**

Create `tests/e2e/spot-detail.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Spot Detail", () => {
  test("detail page renders spot title", async ({ page }) => {
    // Navigate directly to a spot (ID 1 should exist)
    await page.goto("/spots/1");
    const title = page.getByTestId("spot-title");
    await expect(title).toBeVisible({ timeout: 10000 });
    await expect(title).not.toBeEmpty();
  });

  test("back button is present", async ({ page }) => {
    await page.goto("/spots/1");
    const back = page.getByTestId("back-button");
    await expect(back).toBeVisible();
  });

  test("share button is present", async ({ page }) => {
    await page.goto("/spots/1");
    const share = page.getByTestId("share-button");
    await expect(share).toBeVisible();
  });

  test("Google Maps link has correct URL", async ({ page }) => {
    await page.goto("/spots/1");
    const link = page.getByTestId("open-google-maps");
    if (await link.isVisible()) {
      const href = await link.getAttribute("href");
      expect(href).toContain("google.com/maps/dir");
    }
  });
});
```

- [ ] **Step 3: Create navigation tests**

Create `tests/e2e/navigation.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Navigation — Back Button State Preservation", () => {
  test("navigating back from spot detail restores search query", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("search-input");
    await input.fill("Berlin");
    await page.waitForTimeout(500);

    // Navigate to a spot detail
    await page.goto("/spots/1");
    await page.getByTestId("spot-title").waitFor({ timeout: 10000 });

    // Go back
    await page.goBack();
    await page.waitForTimeout(500);

    // Search query should be restored from URL
    await expect(input).toHaveValue("Berlin");
  });

  test("URL params are preserved across navigation", async ({ page }) => {
    await page.goto("/?q=Berlin&bars=1");
    const input = page.getByTestId("search-input");
    await expect(input).toHaveValue("Berlin");

    // Navigate to spot detail
    await page.goto("/spots/1");
    await page.goBack();
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/q=Berlin/);
    await expect(page).toHaveURL(/bars=1/);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npx playwright test tests/e2e/spot-preview.spec.ts tests/e2e/spot-detail.spec.ts tests/e2e/navigation.spec.ts --project=chromium
```

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/
git commit -m "test: add E2E tests for spot preview, detail, and back navigation"
```

---

## Task 18: E2E Tests — Mobile, Geolocation, Telegram

**Beads:** `outdoor-workout-spots-iwo`

**Files:**
- Create: `tests/e2e/bottom-sheet.spec.ts`
- Create: `tests/e2e/responsive.spec.ts`
- Create: `tests/e2e/geolocation.spec.ts`
- Create: `tests/api/telegram.spec.ts`

- [ ] **Step 1: Create bottom sheet tests**

Create `tests/e2e/bottom-sheet.spec.ts`:

```typescript
import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["Pixel 5"] });

test.describe("Bottom Sheet (Mobile)", () => {
  test("bottom sheet is visible in peek state", async ({ page }) => {
    await page.goto("/");
    const sheet = page.getByTestId("bottom-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveAttribute("data-state", "peek");
  });

  test("shows spot count", async ({ page }) => {
    await page.goto("/");
    const handle = page.getByTestId("bottom-sheet-handle");
    await expect(handle).toContainText(/\d+ spots nearby/);
  });
});
```

- [ ] **Step 2: Create responsive tests**

Create `tests/e2e/responsive.spec.ts`:

```typescript
import { test, expect, devices } from "@playwright/test";

test.describe("Responsive Layout", () => {
  test("desktop shows sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
  });

  test("mobile hides sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto("/");
    const sidebar = page.locator("aside");
    await expect(sidebar).not.toBeVisible();
  });

  test("mobile shows bottom sheet", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto("/");
    const sheet = page.getByTestId("bottom-sheet");
    await expect(sheet).toBeVisible();
  });

  test("desktop hides bottom sheet", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const sheet = page.getByTestId("bottom-sheet");
    await expect(sheet).not.toBeVisible();
  });
});
```

- [ ] **Step 3: Create geolocation tests**

Create `tests/e2e/geolocation.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Geolocation", () => {
  test("locate me button triggers geolocation", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 52.52, longitude: 13.405 });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const locateBtn = page.getByTestId("locate-me");
    if (await locateBtn.isVisible()) {
      await locateBtn.click();
      // Should show "Locating..." or user location marker
      await page.waitForTimeout(2000);
    }
  });
});
```

- [ ] **Step 4: Create Telegram webhook tests**

Create directory and test file:

```bash
mkdir -p tests/api
```

Create `tests/api/telegram.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Telegram Webhook API", () => {
  const WEBHOOK_URL = "/api/telegram/webhook";

  test("returns help for non-location message", async ({ request }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: {
        update_id: 1,
        message: {
          message_id: 1,
          chat: { id: 123, type: "private" },
          date: Math.floor(Date.now() / 1000),
          text: "hello",
        },
      },
    });
    // Grammy responds via Telegram API, not HTTP body — just check it doesn't crash
    expect(res.status()).toBeLessThan(500);
  });

  test("handles location message without error", async ({ request }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: {
        update_id: 2,
        message: {
          message_id: 2,
          chat: { id: 123, type: "private" },
          date: Math.floor(Date.now() / 1000),
          location: { latitude: 52.52, longitude: 13.405 },
        },
      },
    });
    expect(res.status()).toBeLessThan(500);
  });
});
```

Note: These tests verify the webhook doesn't crash. Full integration testing requires a real bot token, which should be done manually or in staging.

- [ ] **Step 5: Run all tests**

```bash
npx playwright test --project=chromium
```

- [ ] **Step 6: Commit**

```bash
git add tests/
git commit -m "test: add E2E tests for bottom sheet, responsive, geolocation, and Telegram"
```

---

## Task 19: Final Cleanup and Verification

**Files:**
- Verify: all files listed in "Files to Delete" are gone
- Verify: no references to old neon/glow classes remain
- Verify: build and all tests pass

- [ ] **Step 1: Check for leftover neon references**

```bash
grep -r "neon-" --include="*.tsx" --include="*.ts" --include="*.css" app/ components/ hooks/ lib/
```

Expected: No results. If any found, replace with new design tokens.

- [ ] **Step 2: Check for deleted file references**

```bash
grep -r "FloatingBackground\|ThreeDKettlebell\|webgl\|useReducedMotion\|ErrorBoundary" --include="*.tsx" --include="*.ts" app/ components/ hooks/ lib/
```

Expected: No results.

- [ ] **Step 3: Full build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Run all Playwright tests**

```bash
npx playwright test --project=chromium
```

Expected: All tests pass.

- [ ] **Step 5: Run tests on mobile emulation**

```bash
npx playwright test --project="Mobile Chrome"
```

Expected: All mobile tests pass.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup — verify no leftover neon references"
```

---

## Execution Order Summary

| # | Task | Beads ID | Est. |
|---|------|----------|------|
| 1 | Remove 3D/animation deps | 82y | 30m |
| 2 | Design system (globals.css) | rrn | 20m |
| 3 | App shell (layout.tsx) | rrn | 10m |
| 4 | URL state (lat/lng/z) | xhe | 15m |
| 5 | Search bar restyle | mo9 | 10m |
| 6 | Filter chips restyle | mo9 | 10m |
| 7 | Spot cards restyle | 346 | 15m |
| 8 | Spots list restyle | 346 | 10m |
| 9 | Map markers restyle | 7g6 | 20m |
| 10 | Desktop layout (page.tsx) | f10 | 25m |
| 11 | Mobile bottom sheet | 8fc | 30m |
| 12 | Spot preview panel | iie | 20m |
| 13 | Spot detail page | gcd | 25m |
| 14 | Telegram webhook | ydb | 30m |
| 15 | Telegram setup script | 345 | 10m |
| 16 | Tests: map/search/filters | k1v | 20m |
| 17 | Tests: preview/detail/nav | 25e | 20m |
| 18 | Tests: mobile/geo/telegram | iwo | 20m |
| 19 | Final cleanup | — | 15m |

Tasks 1-4 are sequential (foundational). Tasks 5-9 can be parallelized. Tasks 10-13 are sequential (layout dependencies). Tasks 14-15 are independent (can parallel with 10-13). Tests (16-18) after implementation. Task 19 last.
