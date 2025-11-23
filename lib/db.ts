/**
 * Turso Database Client
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local for scripts
if (typeof window === 'undefined') {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
}

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL is not set');
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN is not set');
}

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
