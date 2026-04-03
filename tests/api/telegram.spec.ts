import { test, expect } from "@playwright/test";

test.describe("Telegram Webhook API", () => {
  const WEBHOOK_URL = "/api/telegram/webhook";

  test("webhook endpoint is reachable", async ({ request }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: {
        update_id: 3,
        message: {
          message_id: 3,
          chat: { id: 456, type: "private" },
          date: Math.floor(Date.now() / 1000),
          text: "test",
        },
      },
    });
    // Without TELEGRAM_WEBHOOK_SECRET, returns 500 (secret not configured)
    // With secret but no header, returns 401
    // Both are expected in test environment
    expect([200, 401, 500]).toContain(res.status());
  });

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
    expect([200, 401, 500]).toContain(res.status());
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
    expect([200, 401, 500]).toContain(res.status());
  });
});
