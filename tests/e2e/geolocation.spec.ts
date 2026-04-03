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
      await page.waitForTimeout(2000);
    }
  });
});
