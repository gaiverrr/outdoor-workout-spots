import { Bot, webhookCallback } from "grammy";
import { db } from "@/lib/db";
import { formatDistance } from "@/lib/distance";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN environment variable is required");
}

const APP_URL = process.env.APP_URL || "https://workoutspots.app";

const bot = new Bot(token);

interface SpotRow {
  id: number;
  title: string;
  lat: number | null;
  lon: number | null;
  address: string | null;
  equipment: string | null;
  rating: number | null;
}

function getDistanceKm(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

bot.on("message:location", async (ctx) => {
  const { latitude, longitude } = ctx.message.location;

  const result = await db.execute({
    sql: `SELECT id, title, lat, lon, address, equipment, rating
          FROM spots
          WHERE lat BETWEEN ? AND ?
            AND lon BETWEEN ? AND ?
            AND lat IS NOT NULL
            AND lon IS NOT NULL
          LIMIT 200`,
    args: [
      latitude - 0.5,
      latitude + 0.5,
      longitude - 0.5,
      longitude + 0.5,
    ],
  });

  const spots = (result.rows as unknown as SpotRow[])
    .filter((r) => r.lat != null && r.lon != null)
    .map((r) => ({
      ...r,
      distance: getDistanceKm(
        { lat: latitude, lon: longitude },
        { lat: r.lat!, lon: r.lon! }
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  if (spots.length === 0) {
    await ctx.reply("No workout spots found nearby. Try a different location!");
    return;
  }

  const lines = spots.map((spot, i) => {
    const parts = [`${i + 1}. ${spot.title} (${formatDistance(spot.distance)})`];
    if (spot.rating != null) {
      parts.push(`   Rating: ${spot.rating}/100`);
    }
    if (spot.equipment) {
      try {
        const eq = JSON.parse(spot.equipment) as string[];
        if (eq.length > 0) parts.push(`   ${eq.slice(0, 3).join(", ")}`);
      } catch {
        // skip malformed equipment
      }
    }
    parts.push(`   ${APP_URL}/spots/${spot.id}`);
    return parts.join("\n");
  });

  await ctx.reply(
    `📍 5 nearest workout spots:\n\n${lines.join("\n\n")}`,
    { link_preview_options: { is_disabled: true } }
  );
});

bot.on("message", async (ctx) => {
  await ctx.reply(
    "Send me your 📍 location and I'll find the 5 nearest workout spots!\n\n" +
      "Tap the 📎 attachment button → Location → Send your current location."
  );
});

export const POST = webhookCallback(bot, "std/http");
