import { NextRequest } from "next/server";

/**
 * Extract the client IP address from a request.
 * Handles various proxy headers used by Vercel and other providers.
 */
export function getClientIP(request: NextRequest): string {
  // Try x-forwarded-for first (Vercel and most proxies)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP in the list
    const firstIP = forwardedFor.split(",")[0].trim();
    if (firstIP) return firstIP;
  }

  // Try x-real-ip (some proxies)
  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP.trim();

  // Fallback
  return "unknown";
}
