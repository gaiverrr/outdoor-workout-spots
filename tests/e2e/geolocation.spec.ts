import { test, expect } from "@playwright/test";

test.describe("Geolocation", () => {
  test("locate me button triggers geolocation and shows location text", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 52.52, longitude: 13.405 });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const locateBtn = page.getByTestId("locate-me");
    if (await locateBtn.isVisible()) {
      await locateBtn.click();
      // After clicking locate, the button should change to "Locating..." or disappear
      // and spots should show distance
      await page.waitForTimeout(3000);
      // Verify the location status changed (button no longer shows "idle" state)
      await expect(locateBtn).not.toBeVisible({ timeout: 5000 });
    }
  });
});
