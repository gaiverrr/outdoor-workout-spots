/**
 * Simple in-memory rate limiter
 * For production, consider using Upstash Redis or similar
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Maximum number of requests per window */
  limit: number;
  /** Time window in milliseconds */
  window: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Check if a request is within rate limits
 * @param identifier Unique identifier (e.g., IP address)
 * @param config Rate limit configuration
 * @returns Rate limit result with remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 100, window: 60 * 1000 } // 100 requests per minute by default
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    // First request or window expired - start new window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.window,
    });

    return {
      success: true,
      remaining: config.limit - 1,
      reset: now + config.window,
    };
  }

  // Within existing window
  if (entry.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    success: true,
    remaining: config.limit - entry.count,
    reset: entry.resetTime,
  };
}
