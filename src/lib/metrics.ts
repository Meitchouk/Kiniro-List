import { Redis } from "@upstash/redis";

/**
 * Analytics and metrics tracking via Redis sorted sets.
 * Tracks anime views and search queries for trending/popular features.
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/** Generate a daily-scoped Redis key */
function todayKey(prefix: string) {
  const d = new Date();
  const day = d.toISOString().slice(0, 10); // YYYY-MM-DD
  return `${prefix}:${day}`;
}

/**
 * Track anime detail views for trending metrics.
 * Increments both daily and all-time counters.
 * @param animeId - The anime ID being viewed
 */
export async function trackAnimeView(animeId: number): Promise<void> {
  try {
    const member = String(animeId);
    const dayKey = todayKey("metrics:anime:views");
    await redis.zincrby(dayKey, 1, member);
    // keep daily keys for 14 days
    await redis.expire(dayKey, 60 * 60 * 24 * 14);
    // global aggregate (no expiry)
    await redis.zincrby("metrics:anime:views:all", 1, member);
  } catch (error) {
    // Non-critical: log and continue
    console.error("Failed to track anime view:", error);
  }
}

/**
 * Get trending anime IDs based on view counts.
 * @param limit - Maximum number of IDs to return
 * @param scope - 'day' for today's trending, 'all' for all-time
 * @returns Array of anime IDs sorted by popularity
 */
export async function getTrendingAnime(
  limit = 20,
  scope: "day" | "all" = "day"
): Promise<number[]> {
  try {
    const key = scope === "day" ? todayKey("metrics:anime:views") : "metrics:anime:views:all";
    const members = (await redis.zrange(key, "-inf", "+inf", {
      byScore: true,
      rev: true,
      offset: 0,
      count: Math.max(limit, 0),
    })) as string[] | null;
    return (members || [])
      .map((id: string) => Number(id))
      .filter((n: number) => Number.isFinite(n));
  } catch (error) {
    console.error("Failed to get trending anime:", error);
    return [];
  }
}

/**
 * Track search query popularity for improving suggestions.
 * @param q - The search query string
 */
export async function trackSearchQuery(q: string): Promise<void> {
  try {
    const term = q.trim().toLowerCase();
    if (!term) return;
    const dayKey = todayKey("metrics:search:queries");
    await redis.zincrby(dayKey, 1, term);
    await redis.expire(dayKey, 60 * 60 * 24 * 7);
  } catch (error) {
    console.error("Failed to track search query:", error);
  }
}

/**
 * Get the most popular search queries for today.
 * @param limit - Maximum number of queries to return
 * @returns Array of search query strings sorted by popularity
 */
export async function getTopSearchQueries(limit = 10): Promise<string[]> {
  try {
    const key = todayKey("metrics:search:queries");
    const terms = (await redis.zrange(key, "-inf", "+inf", {
      byScore: true,
      rev: true,
      offset: 0,
      count: Math.max(limit, 0),
    })) as string[] | null;
    return terms || [];
  } catch (error) {
    console.error("Failed to get top search queries:", error);
    return [];
  }
}
