import "dotenv/config";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.APP_URL || "https://outdoor-workout-spots.vercel.app";

if (!TELEGRAM_BOT_TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN not set in .env.local");
  process.exit(1);
}

async function setup() {
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

  const infoRes = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMenuButton`,
    { method: "POST" }
  );
  const info = await infoRes.json();
  console.log("Current menu button:", JSON.stringify(info.result, null, 2));
}

setup();
