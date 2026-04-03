# Telegram Web App (TWA) Integration

**Date:** 2026-04-03

## Scope

Integrate the existing web app as a Telegram Mini App. The app continues to work in a regular browser unchanged. When opened inside Telegram WebView, it auto-detects the environment and adapts: uses native Telegram BackButton, expands to full screen, signals readiness.

The bot gets inline "Show on Map" / "Open Map" web_app buttons in responses, plus a persistent Menu Button in the chat.

## Architecture

**Detection:** `window.Telegram?.WebApp` check on mount. If present → TWA mode. If not → normal browser. No URL params needed.

**New files:**
- `hooks/useTelegramWebApp.ts` — hook for TWA detection and Telegram SDK access
- `scripts/setup-telegram-menu-button.ts` — one-time script to set Menu Button via Telegram API

**Modified files:**
- `app/layout.tsx` — add Telegram Web App SDK `<script>` tag
- `app/spots/[id]/SpotDetailClient.tsx` — use Telegram BackButton when in TWA, hide custom header
- `app/api/telegram/webhook/route.ts` — add web_app inline buttons to bot responses

**Unchanged:** all map components, data hooks, styles, search, filters, bottom sheet, API routes.

## Hook: useTelegramWebApp

```typescript
interface TelegramWebAppState {
  isTWA: boolean;
  showBackButton: (callback: () => void) => void;
  hideBackButton: () => void;
}
```

On mount:
1. Check `window.Telegram?.WebApp`
2. If present: call `webApp.ready()` (signal to Telegram), `webApp.expand()` (full height)
3. Set `isTWA: true`
4. Expose `showBackButton` / `hideBackButton` wrappers around `webApp.BackButton`

In regular browser: `isTWA: false`, all methods are no-ops.

## SDK Loading

Add to `app/layout.tsx` `<head>`:
```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

This script is a no-op when loaded outside Telegram (sets `window.Telegram` but WebApp methods return defaults). Minimal size (~10KB).

## UI Adaptations

### Spot Detail Page (`/spots/[id]`)

**In TWA:** hide the custom sticky header (Back + Share buttons). Use Telegram native BackButton instead:
- On mount: `showBackButton(() => router.back())` or `router.push("/")` if no history
- On unmount: `hideBackButton()`

**In browser:** unchanged — custom sticky header with Back/Share.

### Main Page

No changes. Map, search, filters, bottom sheet all work as-is inside the Telegram WebView.

### Theme

No theme sync needed. Our dark athletic theme (#0f1117 bg) matches Telegram dark mode. The slight color difference is acceptable and avoids complexity.

## Bot Changes

### Inline web_app Button in Location Response

After the 5 nearest spots text, add `reply_markup`:
```json
{
  "inline_keyboard": [[{
    "text": "🗺 Show on Map",
    "web_app": {
      "url": "https://outdoor-workout-spots.vercel.app/?lat={user_lat}&lng={user_lng}&z=12"
    }
  }]]
}
```

This opens the app centered on the user's location at zoom 12.

### Inline web_app Button in Help Response

For non-location messages:
```json
{
  "inline_keyboard": [[{
    "text": "🗺 Open Map",
    "web_app": {
      "url": "https://outdoor-workout-spots.vercel.app"
    }
  }]]
}
```

### Menu Button Setup Script

`scripts/setup-telegram-menu-button.ts`:
- Calls `setChatMenuButton` API
- Sets type: "web_app", text: "Open Map", url: production URL
- One-time setup, idempotent

## Testing

### tests/e2e/twa.spec.ts
- Mock `window.Telegram.WebApp` before page load
- Verify `isTWA` detection works
- Verify custom header hidden on spot detail page in TWA mode
- Verify Telegram BackButton API called

### tests/api/telegram.spec.ts (update existing)
- Verify location response contains `reply_markup` with `web_app` button
- Verify help response contains `reply_markup` with `web_app` button

## Environment Variables

No new env vars. Uses existing `APP_URL` for web_app button URLs. Falls back to `https://outdoor-workout-spots.vercel.app`.

## Dependencies

No new npm packages. The Telegram SDK is loaded via `<script>` tag (standard approach for TWA).

Type declarations for `window.Telegram.WebApp` added inline in the hook file.
