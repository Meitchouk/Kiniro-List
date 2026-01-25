import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis";
import { getSubtitleDownload, type SubtitleResult } from "@/lib/subtitles";
import { z } from "zod";

// Helper to handle optional URL param (null/empty = undefined)
const optionalUrl = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.string().url().optional()
);

const downloadSchema = z.object({
  fileId: z.coerce.number().int().positive(),
  source: z.enum(["opensubtitles", "subdl"]).optional().default("opensubtitles"),
  downloadUrl: optionalUrl, // For Subdl direct URLs
});

/**
 * Get download link for an external subtitle
 * GET /api/streaming/subtitles/download?fileId=...&source=...
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit check (stricter for downloads)
    const rateLimitResult = await checkRateLimit(request, "streaming");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const parseResult = downloadSchema.safeParse({
      fileId: searchParams.get("fileId"),
      source: searchParams.get("source") || "opensubtitles",
      downloadUrl: searchParams.get("downloadUrl"),
    });

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const { fileId, source, downloadUrl: directUrl } = parseResult.data;

    // Create a minimal SubtitleResult to get download URL
    const subtitle: SubtitleResult = {
      id: `${source}-${fileId}`,
      language: "",
      languageCode: "",
      downloadCount: 0,
      rating: 0,
      release: "",
      isHD: false,
      isTrusted: false,
      isAiTranslated: false,
      fileId,
      downloadUrl: directUrl, // Pass direct URL for Subdl
      source,
    };

    // Get download URL
    const downloadUrl = await getSubtitleDownload(subtitle);

    return NextResponse.json({
      fileId,
      source,
      downloadUrl,
    });
  } catch (error) {
    console.error("Subtitle download error:", error);
    return NextResponse.json({ error: "Failed to get subtitle download link" }, { status: 500 });
  }
}
