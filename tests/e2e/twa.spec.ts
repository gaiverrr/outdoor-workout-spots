import { test, expect } from "@playwright/test";

test.describe("Telegram Web App", () => {
  test("app works normally without Telegram SDK", async ({ page }) => {
    await page.goto("/");
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
    // Block the real Telegram SDK so our mock is not overwritten
    await page.route("**/telegram-web-app.js", (route) => route.fulfill({ body: "" }));

    await page.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Telegram = {
        WebApp: {
          ready: () => {},
          expand: () => {},
          close: () => {},
          initData: "query_id=AAH&user=%7B%7D&auth_date=1234567890&hash=abc",
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
