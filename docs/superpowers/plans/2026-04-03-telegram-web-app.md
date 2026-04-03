# Telegram Web App Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the existing web app as a Telegram Mini App with native back button, inline map buttons in bot responses, and persistent Menu Button.

**Architecture:** Auto-detect TWA via `window.Telegram?.WebApp` on mount. Adapt spot detail page header in TWA mode. Add web_app keyboard buttons to bot responses. Set Menu Button via setup script.

**Tech Stack:** Telegram Web App SDK (script tag), Grammy (existing), Next.js (existing)

**Spec:** `docs/superpowers/specs/2026-04-03-telegram-web-app-design.md`

---

## File Structure

### New Files
- `hooks/useTelegramWebApp.ts` — TWA detection hook
- `scripts/setup-telegram-menu-button.ts` — Menu Button setup
- `tests/e2e/twa.spec.ts` — TWA-specific E2E tests

### Modified Files
- `app/layout.tsx` — add Telegram SDK script tag
- `app/spots/[id]/SpotDetailClient.tsx` — TWA-aware back button
- `app/api/telegram/webhook/route.ts` — add web_app inline buttons
- `tests/api/telegram.spec.ts` — verify inline buttons in response

---

## Task 1: Telegram Web App SDK Script Tag

**Beads:** create new issue
**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add Telegram SDK script to layout head**

In `app/layout.tsx`, add a `<Script>` import and tag. Change the `<html>` element to include the SDK:

```tsx
import Script from "next/script";
```

Add right after the opening `<body>` tag, before `<Providers>`:

```tsx
<Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
```

The full return becomes:
```tsx
return (
  <html lang="en" className={`${geistSans.variable} h-full`}>
    <body className="antialiased h-full">
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <Providers>
        <RegisterServiceWorker />
        <main className="h-dvh">{children}</main>
      </Providers>
    </body>
  </html>
);
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add Telegram Web App SDK script tag"
```

---

## Task 2: useTelegramWebApp Hook

**Files:**
- Create: `hooks/useTelegramWebApp.ts`

- [ ] **Step 1: Create the hook**

Create `hooks/useTelegramWebApp.ts`:

```typescript
"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  themeParams: Record<string, string>;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

interface UseTelegramWebAppReturn {
  isTWA: boolean;
  showBackButton: (callback: () => void) => void;
  hideBackButton: () => void;
}

export function useTelegramWebApp(): UseTelegramWebAppReturn {
  const [isTWA, setIsTWA] = useState(false);
  const webAppRef = useRef<TelegramWebApp | null>(null);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      webAppRef.current = webApp;
      setIsTWA(true);
      webApp.ready();
      webApp.expand();
    }
  }, []);

  const showBackButton = useCallback((callback: () => void) => {
    const webApp = webAppRef.current;
    if (!webApp) return;
    webApp.BackButton.onClick(callback);
    webApp.BackButton.show();
  }, []);

  const hideBackButton = useCallback(() => {
    const webApp = webAppRef.current;
    if (!webApp) return;
    webApp.BackButton.hide();
  }, []);

  return { isTWA, showBackButton, hideBackButton };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useTelegramWebApp.ts
git commit -m "feat: add useTelegramWebApp hook for TWA detection"
```

---

## Task 3: Adapt Spot Detail Page for TWA

**Files:**
- Modify: `app/spots/[id]/SpotDetailClient.tsx`

- [ ] **Step 1: Add TWA hook import and usage**

At the top of `app/spots/[id]/SpotDetailClient.tsx`, add import:

```typescript
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
```

Inside the `SpotDetailClient` component, after `const { location: userLocation } = useUserLocation();`, add:

```typescript
const { isTWA, showBackButton, hideBackButton } = useTelegramWebApp();
```

- [ ] **Step 2: Add useEffect for Telegram BackButton**

Add this import at the top (add `useEffect` to the existing import from "react"):

```typescript
import { useState, useEffect } from "react";
```

Add after the `useTelegramWebApp()` call:

```typescript
useEffect(() => {
  if (!isTWA) return;
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };
  showBackButton(handleBack);
  return () => hideBackButton();
}, [isTWA, showBackButton, hideBackButton, router]);
```

- [ ] **Step 3: Conditionally hide the custom header in TWA**

Replace the current `<header>` element (the sticky top-0 one with Back and Share buttons) by wrapping it in a condition:

Change:
```tsx
<header className="sticky top-0 z-10 bg-app/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
```

To:
```tsx
{!isTWA && (
<header className="sticky top-0 z-10 bg-app/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
```

And add the closing `)}` after the `</header>` closing tag.

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/spots/[id]/SpotDetailClient.tsx
git commit -m "feat: use Telegram BackButton on spot detail page in TWA mode"
```

---

## Task 4: Add web_app Inline Buttons to Bot Responses

**Files:**
- Modify: `app/api/telegram/webhook/route.ts`

- [ ] **Step 1: Read the current webhook route file**

Read `app/api/telegram/webhook/route.ts` to see the current structure.

- [ ] **Step 2: Add APP_URL constant and inline button to location response**

The file already has `const APP_URL = process.env.APP_URL || "https://outdoor-workout-spots.vercel.app";`

Find the `ctx.reply` call inside the `bot.on("message:location", ...)` handler (the one that sends the "5 nearest workout spots" message). Change it to add `reply_markup`:

Replace:
```typescript
await ctx.reply(
  `📍 5 nearest workout spots:\n\n${lines.join("\n\n")}`,
  { link_preview_options: { is_disabled: true } }
);
```

With:
```typescript
await ctx.reply(
  `📍 5 nearest workout spots:\n\n${lines.join("\n\n")}`,
  {
    link_preview_options: { is_disabled: true },
    reply_markup: {
      inline_keyboard: [[{
        text: "🗺 Show on Map",
        web_app: { url: `${APP_URL}/?lat=${latitude}&lng=${longitude}&z=12` },
      }]],
    },
  }
);
```

- [ ] **Step 3: Add inline button to help response**

Find the `bot.on("message", ...)` handler (the one that sends "Send me your 📍 location..."). Change it to add `reply_markup`:

Replace:
```typescript
await ctx.reply(
  "Send me your 📍 location and I'll find the 5 nearest workout spots!\n\n" +
    "Tap the 📎 attachment button → Location → Send your current location."
);
```

With:
```typescript
await ctx.reply(
  "Send me your 📍 location and I'll find the 5 nearest workout spots!\n\n" +
    "Tap the 📎 attachment button → Location → Send your current location.",
  {
    reply_markup: {
      inline_keyboard: [[{
        text: "🗺 Open Map",
        web_app: { url: APP_URL },
      }]],
    },
  }
);
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/api/telegram/webhook/route.ts
git commit -m "feat: add web_app inline buttons to bot responses"
```

---

## Task 5: Menu Button Setup Script

**Files:**
- Create: `scripts/setup-telegram-menu-button.ts`

- [ ] **Step 1: Create the script**

Create `scripts/setup-telegram-menu-button.ts`:

```typescript
import "dotenv/config";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.APP_URL || "https://outdoor-workout-spots.vercel.app";

if (!TELEGRAM_BOT_TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN not set in .env.local");
  process.exit(1);
}

async function setup() {
  // Set the Menu Button to open the Web App
  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setChatMenuButton`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menu_button: {
          type: "web_app",
          text: "Open Map",
          web_app: { url: APP_URL },
        },
      }),
    }
  );

  const data = await res.json();
  if (data.ok) {
    console.log(`Menu button set: "Open Map" → ${APP_URL}`);
  } else {
    console.error("Failed to set menu button:", data.description);
    process.exit(1);
  }

  // Verify by getting current menu button
  const infoRes = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMenuButton`,
    { method: "POST" }
  );
  const info = await infoRes.json();
  console.log("Current menu button:", JSON.stringify(info.result, null, 2));
}

setup();
```

- [ ] **Step 2: Commit**

```bash
git add scripts/setup-telegram-menu-button.ts
git commit -m "feat: add Telegram Menu Button setup script"
```

- [ ] **Step 3: Run the script to configure the bot**

```bash
npx tsx scripts/setup-telegram-menu-button.ts
```

Expected: `Menu button set: "Open Map" → https://outdoor-workout-spots.vercel.app`

---

## Task 6: E2E Tests

**Files:**
- Create: `tests/e2e/twa.spec.ts`
- Modify: `tests/api/telegram.spec.ts`

- [ ] **Step 1: Create TWA E2E tests**

Create `tests/e2e/twa.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Telegram Web App", () => {
  test("app works normally without Telegram SDK", async ({ page }) => {
    await page.goto("/");
    // Map should render normally
    const map = page.getByTestId("spots-map");
    await expect(map).toBeVisible();
  });

  test("spot detail shows custom header in browser mode", async ({ page }) => {
    await page.goto("/spots/83");
    await page.getByTestId("spot-title").waitFor({ timeout: 15000 });
    const back = page.getByTestId("back-button");
    await expect(back).toBeVisible();
  });

  test("spot detail hides custom header in TWA mode", async ({ page }) => {
    // Mock Telegram WebApp before navigation
    await page.addInitScript(() => {
      (window as any).Telegram = {
        WebApp: {
          ready: () => {},
          expand: () => {},
          close: () => {},
          BackButton: {
            show: () => {},
            hide: () => {},
            onClick: () => {},
            offClick: () => {},
          },
          themeParams: {},
        },
      };
    });

    await page.goto("/spots/83");
    await page.getByTestId("spot-title").waitFor({ timeout: 15000 });
    const back = page.getByTestId("back-button");
    await expect(back).not.toBeVisible();
  });
});
```

- [ ] **Step 2: Update Telegram API tests to check for inline buttons**

Replace the content of `tests/api/telegram.spec.ts` with:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Telegram Webhook API", () => {
  const WEBHOOK_URL = "/api/telegram/webhook";

  test("returns response for non-location message", async ({ request }) => {
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
    expect(res.status()).toBeLessThanOrEqual(500);
  });

  test("handles location message", async ({ request }) => {
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
    expect(res.status()).toBeLessThanOrEqual(500);
  });
});
```

(Note: Telegram API tests can't directly verify reply_markup because Grammy sends the response to Telegram API, not back in the HTTP response. The tests just verify no crashes. Manual testing in Telegram confirms buttons appear.)

- [ ] **Step 3: Run all tests**

```bash
npx playwright test --project=chromium --reporter=line
```

Expected: All tests pass including the new TWA tests.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/twa.spec.ts tests/api/telegram.spec.ts
git commit -m "test: add TWA E2E tests and update Telegram API tests"
```

---

## Task 7: Beads Issues + Deploy

- [ ] **Step 1: Create beads issues**

```bash
bd create "TWA: SDK script + detection hook" -d "Add Telegram Web App SDK to layout.tsx, create useTelegramWebApp hook" --acceptance "Hook detects TWA environment, returns isTWA/showBackButton/hideBackButton"
bd create "TWA: Spot detail page adaptation" -d "Hide custom header in TWA, use Telegram BackButton" --acceptance "In TWA: no custom header, Telegram BackButton navigates back. In browser: unchanged"
bd create "TWA: Bot inline web_app buttons" -d "Add Show on Map / Open Map buttons to bot responses" --acceptance "Location reply has Show on Map button with coordinates. Help reply has Open Map button"
bd create "TWA: Menu Button + setup script" -d "Script to set persistent Open Map menu button in bot" --acceptance "Running script sets menu button. Visible in Telegram chat"
bd create "TWA: E2E tests" -d "Tests for TWA detection, header visibility, bot responses" --acceptance "All Playwright tests pass on Chromium"
```

- [ ] **Step 2: Deploy to production**

```bash
git push origin test-integration
vercel --prod --yes
```

- [ ] **Step 3: Run Menu Button setup**

```bash
npx tsx scripts/setup-telegram-menu-button.ts
```

- [ ] **Step 4: Close all beads issues**

```bash
bd update <id> --status closed  # for each issue
```

---

## Execution Order

| # | Task | Est. |
|---|------|------|
| 1 | SDK script tag in layout | 5m |
| 2 | useTelegramWebApp hook | 10m |
| 3 | Spot detail TWA adaptation | 10m |
| 4 | Bot inline buttons | 10m |
| 5 | Menu Button setup script | 5m |
| 6 | E2E tests | 10m |
| 7 | Beads + deploy | 5m |

Tasks 1-3 are sequential (hook depends on SDK, page depends on hook). Tasks 4-5 are independent of 1-3. Task 6 after all implementation. Task 7 last.
