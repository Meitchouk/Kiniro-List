import { NextResponse } from "next/server";
import { 
  getHiAnimeHealthStatus, 
  type HiAnimeHealthStatus 
} from "@/lib/streaming/hianime-health";

// API endpoint to check HiAnime health
export async function GET() {
  try {
    const status = await getHiAnimeHealthStatus();

    return NextResponse.json(status, {
      headers: {
        "Cache-Control": "public, max-age=60", // Browser cache for 1 minute
      },
    });
  } catch (error) {
    console.error("[HiAnime Health] Check failed:", error);
    return NextResponse.json(
      {
        available: false,
        lastChecked: Date.now(),
        testedUrls: [],
        reason: "Health check error",
      } as HiAnimeHealthStatus,
      { status: 500 }
    );
  }
}
