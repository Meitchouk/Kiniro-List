import { Redis } from "@upstash/redis";
import { upstash } from "@/lib/config";

/**
 * Lightweight JSON cache over Upstash Redis for ephemeral data.
 * Used for short-lived caching of API responses to reduce external API calls.
 */
const redis = new Redis({
  url: upstash.url,
  token: upstash.token,
});

/**
 * Retrieve a JSON value from Redis cache.
 * @param key - The cache key
 * @returns The cached value or null if not found/expired
 */
export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await redis.get<string>(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Store a JSON value in Redis cache.
 * @param key - The cache key
 * @param value - The value to cache (will be JSON stringified)
 * @param ttlSeconds - Optional TTL in seconds
 */
export async function setJSON(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const payload = JSON.stringify(value);
  if (ttlSeconds && ttlSeconds > 0) {
    await redis.set(key, payload, { ex: ttlSeconds });
  } else {
    await redis.set(key, payload);
  }
}

/**
 * Get a cached value or fetch and cache it if not present.
 * @param key - The cache key
 * @param ttlSeconds - TTL in seconds for the cached value
 * @param fetcher - Async function to fetch the value if not cached
 * @returns The cached or freshly fetched value
 */
export async function getOrSetJSON<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await getJSON<T>(key);
  if (cached !== null) return cached;
  const fresh = await fetcher();
  // Fire and forget set to minimize latency; await to ensure consistency if needed
  await setJSON(key, fresh, ttlSeconds);
  return fresh;
}
