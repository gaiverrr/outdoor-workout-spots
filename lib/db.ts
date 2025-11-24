/**
 * Turso Database Client with connection caching
 */

import { createClient } from '@libsql/client';
import type { Client } from '@libsql/client';

// Cached client instance (singleton pattern)
let cachedClient: Client | null = null;

function createDbClient(): Client {
  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error(
      'TURSO_DATABASE_URL is not set. Please configure environment variables.\n' +
      'See scripts/R2_SETUP.md for setup instructions.'
    );
  }

  if (!process.env.TURSO_AUTH_TOKEN) {
    throw new Error(
      'TURSO_AUTH_TOKEN is not set. Please configure environment variables.\n' +
      'See scripts/R2_SETUP.md for setup instructions.'
    );
  }

  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

// Export singleton instance
export const db = (() => {
  if (cachedClient) {
    return cachedClient;
  }
  cachedClient = createDbClient();
  return cachedClient;
})();
