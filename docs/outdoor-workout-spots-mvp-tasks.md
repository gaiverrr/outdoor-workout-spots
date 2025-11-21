# Outdoor-Workout-Spots — MVP Task List
Tech: Next.js 16, React 19, Tailwind 4, MapLibre GL JS + react-maplibre-gl, PWA

Each task is sized ~1–2 hours for a senior dev.

---

## 1. Core setup

- [ ] **SETUP-01: Initialize Tailwind 4 & base styles**
  - Add Tailwind 4 config.
  - Configure global styles (mobile-first, full-height body, base typography).
  - Verify Tailwind classes work in a sample page.

- [ ] **SETUP-02: Create “crazy” base theme tokens**
  - Define Tailwind custom colors (neon gradients, dark background).
  - Set base font sizes, radius, shadows.
  - Add utility classes (e.g. `.bg-app`, `.text-glow`) for crazy design.

- [ ] **SETUP-03: Project structure & base layout**
  - Set up `app/` routes with:
    - `app/layout.tsx` as `AppLayout`.
    - `app/page.tsx` as `HomePage`.
  - Add top nav with logo text “OUTDOOR WORKOUT SPOTS”.

---

## 2. Data model & API

- [ ] **DATA-01: Static spots JSON file**
  - Move sample data into `/public/spots.json` (or `/data/spots.json`).
  - Ensure it follows `CalisthenicsSpot` / `CalisthenicsSpotDetails` types.

- [ ] **DATA-02: Read-only spots API route**
  - Add `/api/spots` (Next route handler).
  - Serve static JSON, typed with `CalisthenicsSpots`.
  - Handle basic error (e.g. missing file).

- [ ] **DATA-03: `useSpots` hook**
  - Fetch from `/api/spots`.
  - Normalize data (trim equipment, remove empty strings, dedupe).
  - Return `{ spots, loading, error }`.

---

## 3. Location & distance logic

- [ ] **LOC-01: `useUserLocation` hook**
  - Wrap `navigator.geolocation.getCurrentPosition`.
  - Return `{ location, status, error }`.
  - Handle granted/denied/error states.

- [ ] **LOC-02: Distance utility**
  - Implement `getDistanceKm(from, to)` (Haversine or simple approximation).
  - Add a couple of basic tests for sanity.

- [ ] **LOC-03: `useSpotsWithDistance` hook**
  - Combine `spots` + `userLocation`.
  - Add `distanceKm` field to each spot (if location available).
  - Sort by distance ascending.

---

## 4. Map (MapLibre + react-maplibre-gl)

- [ ] **MAP-01: MapLibre stack installation & config**
  - Install `maplibre-gl` + `react-maplibre-gl`.
  - Configure basic map style (e.g. free MapTiler / OSS style URL, env-based).
  - Create `<BaseMap>` component with hardcoded center & zoom.

- [ ] **MAP-02: `SpotsMap` component (basic)**
  - Props: `spots`, optional `userLocation`.
  - Center map on user location if available, else a default world/region center.
  - Render map container with fixed height on mobile (e.g. `h-[50vh]`).

- [ ] **MAP-03: Spot markers**
  - Add `SpotMarker` component.
  - Render markers for all spots with `lat` & `lon`.
  - Basic clickable marker → calls `onSelectSpot(spot.id)`.

- [ ] **MAP-04: Marker selection & highlighting**
  - Props: `selectedSpotId`, `onSelectSpot`.
  - Highlight selected marker (size, glow, or color).
  - Keep map center/zoom stable when selecting.

---

## 5. Home screen UI (map + list)

- [ ] **HOME-01: `HomePage` layout skeleton**
  - Stack:
    - Top nav.
    - Search bar.
    - Filters row.
    - `SpotsMap`.
    - `SpotsList`.
  - Mobile-first layout with scrollable content below the map.

- [ ] **HOME-02: `SearchBar` component**
  - Controlled input for text query.
  - Props: `query`, `onChange`.
  - Integrate with Home page state.

- [ ] **HOME-03: `QuickFiltersBar`**
  - Simple chip toggles (e.g. “Bars”, “Rings”, “Track”). 
  - Represent filter state as boolean flags.
  - Use Tailwind neon styles for “crazy” look.

- [ ] **HOME-04: `useFilteredSpots` hook**
  - Inputs: `spots`, `searchQuery`, `filters`.
  - Filter by text (title + address) and basic equipment keywords.
  - Return filtered, distance-sorted spots.

- [ ] **HOME-05: `SpotsList` + `SpotCard`**
  - `SpotsList`: vertical list, scrollable, highlights selected spot.
  - `SpotCard` shows title, short address, distance badge, 2–3 equipment chips.
  - Click card → select spot & optionally navigate to details.

---

## 6. Spot details page

- [ ] **DETAIL-01: Route & data loading**
  - Add dynamic route `/spots/[id]`.
  - Fetch a single spot from `/api/spots` or from shared state.
  - Handle not-found / invalid id.

- [ ] **DETAIL-02: Header & meta info**
  - `SpotHeader` component:
    - Title, optional name.
    - Rating pill (use numeric rating for now).
    - Distance if user location known.

- [ ] **DETAIL-03: `SpotImageGallery`**
  - Horizontal scrollable gallery with `details.images`.
  - Fallback placeholder if there are no images.

- [ ] **DETAIL-04: Equipment & disciplines chips**
  - `EquipmentChips` + `DisciplinesChips` components.
  - Clean up duplicates and empty entries.
  - Render as pill-style neon badges.

- [ ] **DETAIL-05: Description & actions**
  - `SpotDescription` with “show more” toggle for long text.
  - `SpotActions`:
    - “Open in Maps” deep link using `lat,lon`.
    - Optional “Copy address” button.

---

## 7. PWA essentials

- [ ] **PWA-01: Web app manifest**
  - Add `manifest.json` with name, short_name, icons, theme/background colors.
  - Link it in the HTML head via Next layout.

- [ ] **PWA-02: Basic service worker**
  - Register a service worker (Next-compatible approach).
  - Cache static assets & app shell for offline load.
  - Provide simple offline fallback page or message.

- [ ] **PWA-03: Install prompt polish**
  - Detect installability and show a small banner/toast (“Install OUTDOOR-WORKOUT-SPOTS”). 
  - Keep this minimal and non-blocking.

---

## 8. Design & UX polish

- [ ] **UX-01: Crazy visual style pass**
  - Apply neon gradients, dark background, bold typography.
  - Ensure map + list + details look cohesive on mobile.

- [ ] **UX-02: Micro-interactions**
  - Add subtle hover/tap scale on `SpotCard`.
  - Animate selected marker (small pulse or glow).
  - Add loading skeletons for spots list & map load.

- [ ] **UX-03: Basic responsiveness**
  - Ensure layout works on small phones and medium screens.
  - On larger screens, arrange map and list side by side.

---

## 9. Cleanup & QA

- [ ] **QA-01: Types & linting**
  - Add strict TypeScript options where possible.
  - Fix ESLint warnings for all new components.

- [ ] **QA-02: Basic unit tests for logic hooks**
  - Test `getDistanceKm`, `useFilteredSpots`.
  - Smoke test for `useUserLocation` (mock geolocation).

- [ ] **QA-03: Manual mobile testing**
  - Test on at least one iOS and one Android device.
  - Validate geolocation, map interaction, PWA install, and offline basics.
