import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis";

// CORS headers for streaming responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

/**
 * Detect content type from magic bytes (first bytes of file)
 * This is more reliable than relying on URLs or server headers
 */
function detectContentTypeFromBytes(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer);

  if (bytes.length < 4) return null;

  // MPEG-TS: Sync byte 0x47 at start (and typically every 188 bytes)
  if (bytes[0] === 0x47) {
    return "video/mp2t";
  }

  // fMP4/MP4: starts with ftyp box or other box types
  // Check for 'ftyp', 'moov', 'moof', 'mdat', 'styp' etc.
  if (bytes.length >= 8) {
    const boxType = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    if (["ftyp", "moov", "moof", "mdat", "styp", "sidx", "free", "skip"].includes(boxType)) {
      return "video/mp4";
    }
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }

  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return "image/gif";
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes.length >= 12
  ) {
    if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return "image/webp";
    }
  }

  // Check if it looks like text content (m3u8, vtt, etc.)
  // Text files typically start with printable ASCII characters
  const textStart = String.fromCharCode(...bytes.slice(0, Math.min(50, bytes.length)));
  if (textStart.includes("#EXTM3U")) {
    return "application/vnd.apple.mpegurl";
  }
  if (textStart.includes("WEBVTT")) {
    return "text/vtt";
  }

  return null;
}

/**
 * Check if content looks like an m3u8 playlist (text-based check)
 */
function isM3u8Content(text: string): boolean {
  // m3u8 files must start with #EXTM3U
  return text.trimStart().startsWith("#EXTM3U");
}

/**
 * Check if the URL pattern suggests this might be a video segment
 * (even if disguised with a fake extension)
 */
function mightBeVideoSegment(url: string): boolean {
  // Common patterns for video segments disguised as other file types:
  // - Long base64-like paths
  // - Numeric segment identifiers
  // - Common segment URL patterns

  // Has a long base64-ish path component (common obfuscation)
  if (/\/[A-Za-z0-9_-]{20,}/.test(url)) {
    // And ends with a suspicious extension that's typically not video
    // Note: Some providers use .vtt, .js, .css to disguise video segments!
    if (
      /\.(gif|png|svg|webp|xml|json|html|jpg|jpeg|txt|ico|vtt|js|css|woff|woff2|ttf|eot)$/i.test(
        url
      )
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Proxy for streaming URLs that require specific headers
 * This adds Referer and other headers that browsers can't send directly
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, "streaming");
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const referer = searchParams.get("referer") || "https://hianime.to/";

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format (basic security check)
    const urlObj = new URL(url);
    if (!urlObj.protocol.startsWith("http")) {
      console.error(`Proxy: Invalid protocol - ${urlObj.protocol}`);
      return new NextResponse(`Invalid protocol: ${urlObj.protocol}`, {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Fetch the content with required headers
    const response = await fetch(url, {
      headers: {
        Referer: referer,
        Origin: new URL(referer).origin,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      console.error(`Proxy: Upstream error ${response.status} for ${url}`);
      return new NextResponse(`Upstream error: ${response.status}`, {
        status: response.status,
        headers: corsHeaders,
      });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const serverStatus = response.status;

    // First, let's peek at the content to determine what it really is
    // This is important because some providers lie about content types
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Detect actual content type from magic bytes
    const detectedType = detectContentTypeFromBytes(buffer);

    // Create detailed log info
    const urlForLog = url.length > 80 ? url.substring(0, 80) + "..." : url;
    const firstBytesHex = Array.from(bytes.slice(0, 16))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
    const firstBytesAscii = Array.from(bytes.slice(0, 16))
      .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : "."))
      .join("");

    // Determine content category for logging
    const isLikelyM3u8 =
      contentType.includes("mpegurl") || url.endsWith(".m3u8") || firstBytesAscii.includes("#EXTM");
    const isLikelySegment = mightBeVideoSegment(url) || url.endsWith(".ts") || url.endsWith(".m4s");
    const contentCategory = isLikelyM3u8 ? "PLAYLIST" : isLikelySegment ? "SEGMENT" : "OTHER";

    console.log(`[PROXY ${contentCategory}] ${urlForLog}`);
    console.log(
      `  └─ Status: ${serverStatus} | Server-CT: ${contentType} | Size: ${buffer.byteLength}b`
    );
    console.log(`  └─ Detected: ${detectedType || "unknown"} | Bytes[0-15]: ${firstBytesHex}`);
    console.log(`  └─ ASCII: "${firstBytesAscii}"`);

    // Check if content looks like an error page (HTML)
    if (
      firstBytesAscii.includes("<!DOCTYPE") ||
      firstBytesAscii.includes("<html") ||
      firstBytesAscii.includes("<HTML")
    ) {
      console.error(`[PROXY ERROR] Server returned HTML instead of video content!`);
      console.error(`  └─ First 200 chars: ${new TextDecoder().decode(bytes.slice(0, 200))}`);
    }

    // For m3u8 files, detect by content, not just headers or extension
    const bufferText = new TextDecoder().decode(buffer.slice(0, 500)); // Check first 500 bytes as text
    const isM3u8 =
      isM3u8Content(bufferText) || contentType.includes("mpegurl") || url.endsWith(".m3u8");

    if (isM3u8) {
      const text = new TextDecoder().decode(buffer);
      const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);

      // Helper to convert URL to proxy URL
      const toProxyUrl = (targetUrl: string): string => {
        const fullUrl = targetUrl.startsWith("http")
          ? targetUrl
          : new URL(targetUrl, baseUrl).toString();
        return `/api/streaming/proxy?url=${encodeURIComponent(fullUrl)}&referer=${encodeURIComponent(referer)}`;
      };

      // Rewrite URLs in the m3u8 to go through our proxy
      // Some providers split URLs across lines, so we need to handle that
      let rewrittenContent = text;

      // Handle weird split-line format (URL on one line, extension on next)
      // Pattern: line ends with base64-ish chars, next line starts with . and extension
      if (/\n\.(gif|png|svg|webp|xml|json|html|jpg|jpeg|ts|m4s)/i.test(text)) {
        // Join split URLs: line ending with alphanumeric + next line starting with .extension
        rewrittenContent = text.replace(
          /\n(\.(gif|png|svg|webp|xml|json|html|jpg|jpeg|ts|m4s))/gi,
          "$1"
        );
      }

      // Now process line by line
      rewrittenContent = rewrittenContent
        .split("\n")
        .map((line) => {
          const trimmedLine = line.trim();

          // Handle empty lines
          if (trimmedLine === "") {
            return line;
          }

          // Handle #EXT-X-KEY lines with URI attribute (encryption keys)
          if (trimmedLine.startsWith("#EXT-X-KEY:")) {
            return line.replace(/URI="([^"]+)"/, (match, uri) => {
              return `URI="${toProxyUrl(uri)}"`;
            });
          }

          // Handle #EXT-X-MAP lines with URI attribute (init segments)
          if (trimmedLine.startsWith("#EXT-X-MAP:")) {
            return line.replace(/URI="([^"]+)"/, (match, uri) => {
              return `URI="${toProxyUrl(uri)}"`;
            });
          }

          // Skip other comment lines
          if (trimmedLine.startsWith("#")) {
            return line;
          }

          // Handle segment URLs (relative or absolute)
          return toProxyUrl(trimmedLine);
        })
        .join("\n");

      return new NextResponse(rewrittenContent, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    // Check if content is VTT subtitles
    // IMPORTANT: Only treat as VTT if magic bytes confirm it's text/vtt
    // Some providers disguise video segments with .vtt extension!
    if (detectedType === "text/vtt") {
      const text = new TextDecoder().decode(buffer);
      return new NextResponse(text, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/vtt; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // If URL suggests VTT but magic bytes say video, it's a disguised segment
    if ((url.endsWith(".vtt") || url.includes("subtitle")) && detectedType === "video/mp2t") {
      console.log(`[PROXY] Disguised segment detected: URL ends with .vtt but content is MPEG-TS`);
      // Fall through to video handling below
    } else if ((contentType.includes("text/vtt") || url.endsWith(".vtt")) && !detectedType) {
      // URL/header says VTT and we couldn't detect type - trust the URL
      const text = new TextDecoder().decode(buffer);
      return new NextResponse(text, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/vtt; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // For SRT subtitle files
    if (url.endsWith(".srt")) {
      const text = new TextDecoder().decode(buffer);
      return new NextResponse(text, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // For ASS/SSA subtitle files
    if (url.endsWith(".ass") || url.endsWith(".ssa")) {
      const text = new TextDecoder().decode(buffer);
      return new NextResponse(text, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // For binary content (segments, keys, etc.)
    // Use intelligent content type detection
    let finalContentType = contentType;

    // 1. If we detected the type from magic bytes, trust that first
    if (detectedType) {
      finalContentType = detectedType;
    }
    // 2. Key files for AES-128 decryption
    else if (url.endsWith(".key") || url.includes("/mon.key") || url.includes("/key")) {
      finalContentType = "application/octet-stream";
    }
    // 3. URL patterns that suggest video segments (even with fake extensions)
    else if (mightBeVideoSegment(url)) {
      // Double-check by examining bytes
      const bytes = new Uint8Array(buffer);
      const firstBytesHex = Array.from(bytes.slice(0, 8))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");

      if (bytes.length > 0 && bytes[0] === 0x47) {
        finalContentType = "video/mp2t";
        console.log(`Proxy: Detected MPEG-TS by sync byte 0x47 | First bytes: ${firstBytesHex}`);
      } else if (bytes.length >= 8) {
        // Check for fMP4
        const boxType = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
        if (["ftyp", "moov", "moof", "mdat", "styp", "sidx"].includes(boxType)) {
          finalContentType = "video/mp4";
          console.log(
            `Proxy: Detected fMP4 by box type '${boxType}' | First bytes: ${firstBytesHex}`
          );
        } else {
          // URL suggests video but bytes don't match - log for diagnosis
          console.log(
            `Proxy: URL suggests video but unknown format | First bytes: ${firstBytesHex} | Box type attempt: '${boxType}'`
          );
          // Still assume MPEG-TS as many providers use non-standard formats
          finalContentType = "video/mp2t";
        }
      }
    }
    // 4. Standard video segment patterns
    else if (
      url.includes("segment-") ||
      url.includes("/seg-") ||
      url.endsWith(".ts") ||
      url.endsWith(".m4s")
    ) {
      const bytes = new Uint8Array(buffer);
      if (bytes.length >= 8) {
        const boxType = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
        if (["ftyp", "moov", "moof", "mdat", "styp", "sidx"].includes(boxType)) {
          finalContentType = "video/mp4";
        } else {
          finalContentType = "video/mp2t";
        }
      } else {
        finalContentType = "video/mp2t";
      }
    }

    console.log(`  └─ Final Content-Type: ${finalContentType}`);

    // Warn if we're sending something that doesn't look like valid video
    if (finalContentType.includes("video") && bytes[0] !== 0x47 && buffer.byteLength > 188) {
      // Not starting with MPEG-TS sync byte
      const possibleBoxType =
        bytes.length >= 8 ? String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]) : "N/A";
      if (!["ftyp", "moov", "moof", "mdat", "styp", "sidx"].includes(possibleBoxType)) {
        console.warn(
          `[PROXY WARNING] Sending as video but content doesn't look like MPEG-TS or fMP4!`
        );
        console.warn(`  └─ First byte: 0x${bytes[0]?.toString(16)} (expected 0x47 for TS)`);
        console.warn(`  └─ Box type check: "${possibleBoxType}"`);
      }
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": finalContentType,
        "Content-Length": buffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse(
      `Proxy error: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500, headers: corsHeaders }
    );
  }
}
