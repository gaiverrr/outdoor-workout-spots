# Outdoor Workout Spots — Frontend Rewrite + Telegram Bot

**Date:** 2026-04-03
**Approach:** Evolutionary refactor — new UI on existing data layer

## Scope

1. Complete frontend redesign (map-first, dark athletic theme)
2. Telegram bot (geolocation → 5 nearest spots)
3. E2E test coverage with Playwright

**Kept as-is:** API route (`/api/spots`), Turso DB, data hooks (useSpotsInfinite, useUserLocation, useSpotsWithDistance, useFilteredSpots, useMapClusters), TanStack Query setup, lib/db.ts, lib/distance.ts, types.

**Removed:** Three.js (ThreeDKettlebell, @react-three/*), Framer Motion, FloatingBackground, FloatingBackgroundLoader, neon glow effects, glass-morphism, all shimmer/gradient animations.

---

## 1. Design System — Dark Athletic

Inspired by Strava, Nike Run Club. Clean, readable, sporty.

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-app` | `#0f1117` | Page background |
| `--bg-surface` | `#1a1d27` | Cards, panels |
| `--bg-elevated` | `#242836` | Modals, popovers |
| `--accent` | `#FF6B35` | CTAs, selected state, active elements |
| `--accent-secondary` | `#4A9EFF` | Links, distance, info badges |
| `--text-primary` | `#F0F0F5` | Headings, main text |
| `--text-secondary` | `#9CA3AF` | Descriptions, metadata |
| `--text-dim` | `#6B7280` | Placeholders, disabled |
| `--border` | `#2A2E3A` | Dividers, card borders |

### Typography

- Font: Inter / Geist Sans (already in project)
- Scale: 14px body, 16px card titles, 20-24px page headings
- Weight: 400 body, 500 labels, 600 headings

### Spacing & Radii

- Card radius: 12px
- Button/input radius: 8px
- Spacing scale: 4/8/12/16/24/32px

### Interactions

- Hover transitions: 150ms ease
- Panel slides: CSS transitions (transform, 250ms)
- Focus rings: 2px solid `--accent`, offset 2px
- No glow, no shimmer, no gradient animations

---

## 2. Layout — Map-First

### Mobile (< 768px)

- Map: 100vh, full screen
- Search bar + filters: fixed top, overlaying map, semi-transparent background
- Spot list: bottom sheet with 3 states:
  - **Peek:** only drag handle + "N spots nearby" visible (~60px)
  - **Half:** 50% of viewport, scrollable list
  - **Full:** 90% of viewport
- Bottom sheet draggable via touch, snaps to states
- Implementation: CSS transforms + touch event handlers (no library)

### Desktop (>= 768px)

- Top bar: search input + filter chips + locate me button
- Left sidebar: 360px wide, spot list with infinite scroll
- Map: fills remaining space
- Sidebar is always visible (no collapse)

### Spot Quick Preview

Triggered by clicking a map marker.

- **Mobile:** card slides up from bottom, overlaying the bottom sheet. Contains: title, distance, rating, 1 thumbnail, "View Details" button.
- **Desktop:** spot card in left sidebar highlights/scrolls into view. Popup on map with same quick info.

---

## 3. URL State & Back Navigation

### URL Parameters

```
?lat=52.52&lng=13.40&z=13&q=berlin&bars=1&rings=0&track=0&spot=1234
```

| Param | Type | Description |
|-------|------|-------------|
| `lat`, `lng`, `z` | float | Map center and zoom |
| `q` | string | Search query |
| `bars`, `rings`, `track` | 0/1 | Equipment filters |
| `spot` | int | Selected spot ID (for preview) |

### Back Navigation Flow

1. User is on map with state encoded in URL
2. Clicks "View Details" → navigates to `/spots/[id]`
3. Presses browser back → returns to previous URL with all params
4. TanStack Query serves data from cache (staleTime: 60s, gcTime: 5min)
5. Map restores center/zoom from URL params
6. Search/filters restore from URL params
7. Result: instant restoration, no re-fetch, no loading state

### Implementation

- Reuse existing `useUrlState` hook, extend with `lat`, `lng`, `z` params
- Map `onMoveEnd` updates URL (debounced 300ms)
- `router.back()` for the back button on spot detail page

---

## 4. Spot Detail Page (`/spots/[id]`)

Full page with dedicated URL for shareability and SEO.

### Sections (top to bottom)

1. **Sticky header:** back button (router.back()) + share button
2. **Hero image:** first photo full-width, 16:9 aspect ratio. Falls back to mini-map if no images.
3. **Title block:** h1 title, address with pin icon, rating + distance
4. **Equipment chips:** styled pills for each equipment item
5. **Description:** spot description text (if available)
6. **Photo gallery:** horizontal scrolling thumbnails (if multiple images)
7. **Location:** static mini-map with marker + "Open in Google Maps" deep link (`https://www.google.com/maps/dir/?api=1&destination={lat},{lon}`)
8. **Nearby spots:** 3-5 nearest spots as horizontal scrolling cards

### Server Component

- Page component is a server component (fetches spot data server-side)
- Client components for interactive parts (gallery, map, share button)

---

## 5. Telegram Bot

### Tech Stack

- Library: `grammy` (lightweight, TypeScript, serverless-friendly)
- Endpoint: `POST /api/telegram/webhook`
- Setup script: `scripts/setup-telegram-webhook.ts`

### Flow

```
User sends 📍 location in Telegram
  → Vercel receives POST /api/telegram/webhook
  → Extract lat/lon from update.message.location
  → Query Turso: SELECT + ORDER BY haversine distance LIMIT 5
  → Format response with distance + app links
  → Reply to user via Grammy bot.api.sendMessage()
```

### Response Format

```
📍 5 nearest workout spots:

1. Calisthenics Park Mauerpark (0.3 km)
   ⭐ 4.2 · Bars, Rings
   🔗 https://workoutspots.app/spots/1234

2. Street Workout Berlin (0.8 km)
   ⭐ 3.8 · Bars
   🔗 https://workoutspots.app/spots/5678
```

### Non-location Messages

Bot replies with a help message:
```
Send me your 📍 location and I'll find the 5 nearest workout spots!
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `APP_URL` | Base app URL for spot links (e.g., `https://workoutspots.app`) |

### Distance Calculation

Server-side Haversine using `lib/distance.ts` on the query results. SQL pre-filters by bounding box (±0.5 degrees) for performance, then exact Haversine sort in JS.

---

## 6. Testing Strategy

### Test Structure

```
tests/
  e2e/
    map.spec.ts          — map renders, markers visible, clusters work
    search.spec.ts       — search filters results, clear resets
    filters.spec.ts      — filter toggles, combinations
    spot-preview.spec.ts — marker click → preview panel appears
    spot-detail.spec.ts  — /spots/[id] page renders correctly
    navigation.spec.ts   — back button restores map/search state
    geolocation.spec.ts  — location request, distance sorting
    bottom-sheet.spec.ts — mobile: drag states (peek/half/full)
    responsive.spec.ts   — mobile vs desktop layout verification
  api/
    telegram.spec.ts     — webhook processes location, returns 5 spots
```

### Approach

- **Geolocation:** mocked via `context.setGeolocation()` and `context.grantPermissions(['geolocation'])`
- **Telegram tests:** send mock webhook payload to API route, verify response structure
- **Mobile tests:** Playwright device emulation (Pixel 5, iPhone 12 — already configured)
- **Each test is atomic:** no inter-test dependencies
- **Pass criteria:** Chromium + Mobile Chrome pass

### Test-per-feature workflow

Every feature implementation follows: code → write test → run test → fix until green → next feature.

---

## 7. Dependency Changes

### Remove

- `@react-three/fiber`, `@react-three/drei`, `three` (3D rendering)
- `framer-motion` (animations)

### Add

- `grammy` (Telegram bot)

### Keep

- `next`, `react`, `react-dom`
- `@tanstack/react-query`
- `react-map-gl`, `maplibre-gl`, `supercluster`
- `@libsql/client`
- `zod`
- `@playwright/test`
- `tailwindcss`

---

## 8. Files to Delete

- `components/UI/FloatingBackground.tsx`
- `components/UI/FloatingBackgroundLoader.tsx`
- `components/UI/ThreeDKettlebell.tsx`
- `components/ErrorBoundary.tsx` (ThreeDErrorBoundary no longer needed; replace with simpler boundary if needed)
- `lib/webgl.ts`
- `hooks/useReducedMotion.ts` (was only used for 3D/heavy animations)

## 9. Files to Rewrite

- `app/globals.css` — new design tokens, remove neon/glow utilities
- `app/layout.tsx` — new header/shell, remove old styling
- `app/page.tsx` — map-first layout with bottom sheet (mobile) / sidebar (desktop)
- `app/spots/[id]/page.tsx` — new detail page layout
- `app/spots/[id]/SpotDetailClient.tsx` — new detail client component
- `components/Map/SpotsMap.tsx` — keep logic, restyle markers/popups
- `components/Spots/SpotsList.tsx` — redesign for sidebar/bottom sheet
- `components/Spots/SpotCard.tsx` — new card design
- `components/Search/SearchBar.tsx` — new styling
- `components/Search/QuickFilters.tsx` — new chip design

## 10. New Files

- `app/api/telegram/webhook/route.ts` — Telegram webhook handler
- `scripts/setup-telegram-webhook.ts` — register webhook with Telegram
- `components/BottomSheet.tsx` — mobile bottom sheet component
- `components/SpotPreview.tsx` — quick preview panel for marker clicks
- `tests/e2e/*.spec.ts` — all test files listed in section 6
- `tests/api/telegram.spec.ts` — Telegram webhook tests
