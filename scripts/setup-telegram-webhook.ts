import "dotenv/config";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.argv[2];

if (!TELEGRAM_BOT_TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN not set in .env.local");
  process.exit(1);
}

if (!WEBHOOK_URL) {
  console.error("Usage: npx tsx scripts/setup-telegram-webhook.ts <webhook-url>");
  console.error("Example: npx tsx scripts/setup-telegram-webhook.ts https://your-app.vercel.app/api/telegram/webhook");
  process.exit(1);
}

async function setup() {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      allowed_updates: ["message"],
    }),
  });

  const data = await res.json();
  if (data.ok) {
    console.log(`Webhook set to: ${WEBHOOK_URL}`);
  } else {
    console.error("Failed to set webhook:", data.description);
    process.exit(1);
  }

  const infoRes = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
  );
  const info = await infoRes.json();
  console.log("Webhook info:", JSON.stringify(info.result, null, 2));
}

setup();
