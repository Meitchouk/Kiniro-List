import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { getClientIP } from "./ip";
import { upstash } from "@/lib/config";
import { logEvent } from "@/lib/logging";

// Create Redis client
const redis = new Redis({
  url: upstash.url,
  token: upstash.token,
});

// Different rate limit configurations
const limiters = {
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    analytics: true,
    prefix: "ratelimit:search",
  }),
  animeDetail: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
    prefix: "ratelimit:anime-detail",
  }),
  calendar: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    analytics: true,
    prefix: "ratelimit:calendar",
  }),
  user: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
    prefix: "ratelimit:user",
  }),
  email: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
    prefix: "ratelimit:email",
  }),
  streaming: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(500, "1 m"), // 500 per minute for HLS segments
    analytics: true,
    prefix: "ratelimit:streaming",
  }),
};

export type RateLimitType = keyof typeof limiters;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(
  request: NextRequest,
  type: RateLimitType,
  uid?: string
): Promise<RateLimitResult> {
  const limiter = limiters[type];
  const identifier = uid ? `uid:${uid}` : `ip:${getClientIP(request)}`;

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export function rateLimitResponse(
  result: RateLimitResult,
  request?: NextRequest,
  type?: RateLimitType
): NextResponse {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

  // Log rate limit event
  if (request) {
    const ip = getClientIP(request);
    const url = new URL(request.url);
    logEvent.rateLimit(ip, url.pathname, { type, limit: result.limit });
  }

  return NextResponse.json(
    {
      error: "Too many requests",
      retryAfter,
      limit: result.limit,
      remaining: result.remaining,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
      },
    }
  );
}
