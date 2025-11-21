First thing: the name + idea totally works for what you want. Let’s turn it into a **tiny but actually usable MVP**.

I’ll base everything on:

* web app (Next 16, React 19, Tailwind 4)
* mobile-first
* PWA
* travel use case
* your `CalisthenicsSpot` / `CalisthenicsSpotDetails` types

---

## 1. Core user story for MVP

> *“I open the app in a new city, it shows me nearby outdoor workout spots on a map/list, I can quickly check if a spot is good for my kind of training, then go there.”*

Everything below supports this story.

---

## 2. MVP Feature Scope

### A. Discover spots near me (absolutely core)

1. **Geolocation + initial load**

   * Request browser geolocation.
   * If granted → show **spots within X km** around current position.
   * If denied → show a simple **search by city / address** input.

2. **Map + list view**

   * **Map view (primary on mobile)**:

     * Centered on current position.
     * Markers for each `CalisthenicsSpot` (basic pin, later crazy design).
   * **List view (below map on mobile)**:

     * Spots sorted by distance from user.
     * Each item: `title`, `distance`, `rating`, 1–2 `equipment` tags.

3. **Spot distance**

   * Compute approximate distance between user location and `lat`/`lon`.
   * Show distance in km (e.g. "1.3 km away").

---

### B. Spot details screen

When user taps on a spot in map or list:

1. **Details page** (`/spot/[id]` or similar):

   * **Basic info**:

     * `title` (main visible name)
     * optional `name` (secondary / alias)
     * `address`
     * `distance` from current location (if available).
   * **Training info**:

     * `equipment` as chips/pills (dedupe empty strings, duplicates).
     * `disciplines` as chips if not empty.
     * `details.features.type` (e.g. pill “OUTDOOR”).
   * **Rating display**:

     * Use `rating` as a score (0–100? 0–20? For MVP just show a numeric “Rating: 15”).
   * **Images**:

     * Simple swipeable gallery using `details.images` URLs.
     * Fallback if no images.

2. **Actions**

   * Button **“Open in Maps”**:

     * Deep link to Google Maps / Apple Maps with `lat`/`lon`.
   * Button **“Start navigation”** (same, but more explicit label).

---

### C. Minimal search & filtering

For travel use you don’t need complex filters in MVP, but some basics are valuable:

1. **Search by city / address**

   * On main screen, a search bar:

     * User types “New York”, “Lisbon”, etc.
     * You geocode it (later) or for now just filter locally by `title` / `address` text (MVP simplest).
   * Results update list + map.

2. **Quick filters (client-side, super simple)**

   * Toggle buttons:

     * “Has bars / pull-up bars” (check `equipment` includes “Calisthenics Park” or “Pull Up” etc).
     * “Has rings” (contains “Gymnastic Rings”).
     * “Has track / run” (contains “Tartan Track” or similar).
   * For MVP you can hardcode keyword checks against `equipment`.

---

### D. PWA essentials (for travel / offline-ish use)

1. **Installable PWA**

   * `manifest.json` with:

     * app name / short name,
     * icons,
     * theme/background colors.
   * Set `display: "standalone"`.

2. **Service worker (basic)**

   * Cache:

     * static assets (JS, CSS, icons),
     * app shell (main page, spot details basic HTML).
   * Offline fallback:

     * If user opens app offline → show:

       * last loaded spots (from localStorage / IndexedDB) **or**
       * at least a nice “You’re offline – can’t load new spots” screen.

3. **Add-to-home-screen readiness**

   * Ensure correct meta tags:

     * `theme-color`,
     * mobile viewport,
     * PWA meta stuff.
   * So on iOS/Android they can “Install” it.

---

### E. Data handling for your current models

You already have:

```ts
export interface CalisthenicsSpotDetails {
  equipment: string[];
  disciplines: string[];
  description: string;
  features: {
    type: string;
  };
  images: string[];
  rating: number;
}

export interface CalisthenicsSpot {
  id: number;
  title: string;
  name?: string | null;
  lat?: number;
  lon?: number;
  address?: string;
  details?: CalisthenicsSpotDetails;
}
```

For MVP:

1. **Minimal backend/data**

   * For v0: a static JSON file with `CalisthenicsSpots` in `/public` or API route `/api/spots`.
   * Client loads the whole dataset, filters on client.

2. **Graceful degradation**

   * If `lat`/`lon` missing → show spot only in list, not on map.
   * If `details` missing → hide sections instead of breaking.
   * Clean `equipment`:

     * remove empty strings,
     * remove duplicates.

3. **Description handling**

   * Your sample has messy text in `description`.
   * MVP: truncate description to e.g. 180 chars and add “Read more” that expands full text.

---

### F. “Crazy” design (but still MVP)

You don’t need full design system now, but define minimal rules that make it feel different:

1. **Visual concept**

   * Dark background.
   * Neon gradients (blue/purple/magenta).
   * Large typography: big titles, huge distance numbers.
   * Asymmetric cards, slightly tilted, micro-animations.

2. **Micro-interactions**

   * Marker bounce / wobble when selected.
   * Card hover/tap: subtle scale + glow.
   * Loading skeleton: animated gradient bars.

3. **Branding pieces**

   * Logo wordmark “OUTDOOR WORKOUT SPOTS” in uppercase, glitchy or monospaced.
   * A tiny mascot/icon (e.g. glowing pull-up bar).

Keep all of this CSS/Tailwind only, no heavy animation libs for MVP.

---

### G. Non-functional MVP requirements

* **Mobile-first layout**

  * Designed primarily for 360–430 px width.
  * Bottom sheet for spot details when opened from map (nice if you have time, otherwise simple page).
* **Performance**

  * Keep initial bundle small (no huge map libs if you can avoid at first; maybe basic Leaflet / Mapbox).

---

### H. Explicitly out of scope for MVP

So you don’t explode scope:

* No user accounts / auth.
* No user-generated ratings or reviews.
* No spot creation/editor.
* No complex routing, workout plans, timers, or training logs.
* No social features (friends, feed, likes, etc.).
* No multi-language yet (just English).

You can add those in V1/V2.

---

If you want next, I can:

* turn this into a checklist of issues (GitHub-style), or
* propose concrete **Next.js route structure + component tree** for MVP based on this scope.
