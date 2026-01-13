/**
 * Redis module exports
 * Provides caching, rate limiting, and metrics functionality
 */

// Cache functions
export { getJSON, setJSON, getOrSetJSON } from "./cache";

// Rate limiting
export { checkRateLimit, rateLimitResponse } from "./ratelimit";
export type { RateLimitType, RateLimitResult } from "./ratelimit";

// Metrics tracking
export { trackAnimeView, getTrendingAnime, trackSearchQuery, getTopSearchQueries } from "./metrics";

// IP utilities (used internally by ratelimit)
export { getClientIP } from "./ip";
