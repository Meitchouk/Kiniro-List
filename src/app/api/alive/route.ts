/**
 * Alive/Liveness Check API Route
 *
 * GET /api/alive - Simple liveness probe
 *
 * This is a lightweight endpoint for Kubernetes liveness probes
 * or simple uptime monitoring. It returns immediately with minimal overhead.
 *
 * Use /api/health for detailed health checks.
 * Use /api/alive for quick liveness verification.
 */

import { NextResponse } from "next/server";

// Track server start time
const startTime = Date.now();

export async function GET() {
  return NextResponse.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
}
