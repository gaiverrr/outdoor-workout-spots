import { test, expect } from "@playwright/test";

test.describe("Telegram Webhook API", () => {
  const WEBHOOK_URL = "/api/telegram/webhook";

  test("returns OK for non-location message", async ({ request }) => {
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
