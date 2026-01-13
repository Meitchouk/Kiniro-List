/**
 * Health Check API Route
 *
 * GET /api/health - Returns detailed health status of the application
 *
 * This endpoint checks various system components and returns their status.
 * Useful for monitoring systems, load balancers, and deployment pipelines.
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface HealthCheck {
  name: string;
  status: "healthy" | "unhealthy" | "degraded";
  message?: string;
  latency?: number;
}

interface HealthResponse {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  checks: HealthCheck[];
}

// Track server start time for uptime calculation
const startTime = Date.now();

/**
 * Check if Redis/Upstash is available
 */
async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Check if Redis env vars are configured
    const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!hasRedis) {
      return {
        name: "redis",
        status: "degraded",
        message: "Redis not configured (rate limiting disabled)",
        latency: Date.now() - start,
      };
    }

    // Try a simple ping by making a minimal request
    // Upstash free tier can have higher latency, use 10s timeout
    const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      return {
        name: "redis",
        status: "healthy",
        message: "Connected to Upstash Redis",
        latency: Date.now() - start,
      };
    }

    return {
      name: "redis",
      status: "degraded",
      message: `Redis responded with status ${response.status} (rate limiting may not work)`,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      name: "redis",
      status: "degraded",
      message: `Redis unavailable: ${error instanceof Error ? error.message : "connection failed"} (rate limiting disabled)`,
      latency: Date.now() - start,
    };
  }
}

/**
 * Check if Firebase is configured
 */
function checkFirebase(): HealthCheck {
  const start = Date.now();
  const hasFirebase =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!hasFirebase) {
    return {
      name: "firebase",
      status: "degraded",
      message: "Firebase not configured (authentication disabled)",
      latency: Date.now() - start,
    };
  }

  return {
    name: "firebase",
    status: "healthy",
    message: "Firebase configured",
    latency: Date.now() - start,
  };
}

/**
 * Check disk space for logs (basic check)
 */
function checkDiskSpace(): HealthCheck {
  const start = Date.now();
  try {
    // Just verify we can access the filesystem
    const logDir = path.join(process.cwd(), "app-logs");

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    return {
      name: "disk",
      status: "healthy",
      message: "Log directory accessible",
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      name: "disk",
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Disk check failed",
      latency: Date.now() - start,
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const start = Date.now();
  try {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const heapPercentage = Math.round((used.heapUsed / used.heapTotal) * 100);

    // In development, Next.js uses more memory due to HMR
    const isDev = process.env.NODE_ENV === "development";
    const unhealthyThreshold = isDev ? 98 : 90;
    const degradedThreshold = isDev ? 92 : 75;

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (heapPercentage > unhealthyThreshold) {
      status = "unhealthy";
    } else if (heapPercentage > degradedThreshold) {
      status = "degraded";
    }

    return {
      name: "memory",
      status,
      message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapPercentage}%)`,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      name: "memory",
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Memory check failed",
      latency: Date.now() - start,
    };
  }
}

export async function GET() {
  const checks: HealthCheck[] = [];

  // Run all health checks
  const [redisCheck] = await Promise.all([checkRedis()]);

  checks.push(redisCheck);
  checks.push(checkFirebase());
  checks.push(checkDiskSpace());
  checks.push(checkMemory());

  // Determine overall status
  let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";

  for (const check of checks) {
    if (check.status === "unhealthy") {
      overallStatus = "unhealthy";
      break;
    }
    if (check.status === "degraded") {
      overallStatus = "degraded";
    }
  }

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.1",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV || "development",
    checks,
  };

  // Return 503 if unhealthy, 200 otherwise
  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(response, { status: httpStatus });
}
