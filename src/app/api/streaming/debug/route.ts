import { NextRequest, NextResponse } from "next/server";

/**
 * Debug endpoint to analyze streaming content
 * Usage: /api/streaming/debug?url=<encoded_url>&referer=<encoded_referer>
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const referer = searchParams.get("referer") || "https://animekai.to/";

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    console.log(`[DEBUG] Analyzing: ${url}`);

    const response = await fetch(url, {
      headers: {
        Referer: referer,
        Origin: new URL(referer).origin,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
    });

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Analyze the content
    const analysis = {
      url: url.substring(0, 100) + (url.length > 100 ? "..." : ""),
      httpStatus: response.status,
      httpStatusText: response.statusText,
      serverContentType: response.headers.get("content-type"),
      contentLength: buffer.byteLength,
      headers: Object.fromEntries(response.headers.entries()),

      // Byte analysis
      firstBytesHex: Array.from(bytes.slice(0, 32))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" "),
      firstBytesAscii: Array.from(bytes.slice(0, 32))
        .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : "."))
        .join(""),
      firstBytesDecimal: Array.from(bytes.slice(0, 16)),

      // Format detection
      detection: {
        isMpegTs: bytes[0] === 0x47,
        mpegTsSyncByte:
          bytes[0] === 0x47 ? "✓ Found at byte 0" : `✗ Byte 0 is 0x${bytes[0]?.toString(16)}`,
        isFmp4: false,
        fmp4BoxType: null as string | null,
        looksLikeHtml: false,
        looksLikeJson: false,
        looksLikeM3u8: false,
      },

      // Text preview (if applicable)
      textPreview: null as string | null,
    };

    // Check for fMP4
    if (bytes.length >= 8) {
      const boxType = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
      if (["ftyp", "moov", "moof", "mdat", "styp", "sidx", "free", "skip"].includes(boxType)) {
        analysis.detection.isFmp4 = true;
        analysis.detection.fmp4BoxType = boxType;
      }
    }

    // Check for text content
    const textContent = new TextDecoder().decode(bytes.slice(0, 500));
    if (
      textContent.includes("<!DOCTYPE") ||
      textContent.includes("<html") ||
      textContent.includes("<HTML")
    ) {
      analysis.detection.looksLikeHtml = true;
      analysis.textPreview = textContent.substring(0, 300);
    } else if (textContent.trim().startsWith("{") || textContent.trim().startsWith("[")) {
      analysis.detection.looksLikeJson = true;
      analysis.textPreview = textContent.substring(0, 300);
    } else if (textContent.includes("#EXTM3U")) {
      analysis.detection.looksLikeM3u8 = true;
      analysis.textPreview = textContent.substring(0, 500);
    }

    // Diagnosis
    let diagnosis = "Unknown format";
    if (analysis.detection.isMpegTs) {
      diagnosis = "✓ Valid MPEG-TS stream (starts with sync byte 0x47)";
    } else if (analysis.detection.isFmp4) {
      diagnosis = `✓ Valid fMP4/MP4 container (box type: ${analysis.detection.fmp4BoxType})`;
    } else if (analysis.detection.looksLikeHtml) {
      diagnosis = "✗ ERROR: Server returned HTML instead of video! This is likely an error page.";
    } else if (analysis.detection.looksLikeJson) {
      diagnosis =
        "✗ ERROR: Server returned JSON instead of video! This might be an API error response.";
    } else if (analysis.detection.looksLikeM3u8) {
      diagnosis = "This is an M3U8 playlist, not a video segment.";
    } else {
      diagnosis = `✗ UNKNOWN: First byte is 0x${bytes[0]?.toString(16)}, not a recognized video format`;
    }

    return NextResponse.json(
      {
        ...analysis,
        diagnosis,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch content",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
