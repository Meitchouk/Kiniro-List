import { NextRequest, NextResponse } from "next/server";
import { sendDigestForUser, getDigestPreview } from "@/lib/email/digestService";

/**
 * Test endpoint for daily digest email.
 * Uses the centralized digest service - no duplicate logic.
 *
 * POST /api/email/preview-digest
 * Body: { email: string, send?: boolean }
 *
 * - send: false (default) → returns HTML preview with real data
 * - send: true → sends the email with real data (only if episodes > 0)
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email, send = false } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Send mode
    if (send) {
      const result = await sendDigestForUser(email);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error?.includes("not found") ? 404 : 500 }
        );
      }

      if (result.skippedReason) {
        return NextResponse.json({
          success: true,
          skipped: true,
          reason: result.skippedReason,
          email,
        });
      }

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        sentTo: email,
        episodeCount: result.episodeCount,
        subject: result.subject,
      });
    }

    // Preview mode
    const preview = await getDigestPreview(email);

    if (!preview.success) {
      return NextResponse.json(
        { error: preview.error },
        { status: preview.error?.includes("not found") ? 404 : 500 }
      );
    }

    if (preview.skippedReason) {
      return NextResponse.json({
        success: true,
        preview: true,
        skipped: true,
        reason: preview.skippedReason,
        email,
        userData: preview.userData,
      });
    }

    return NextResponse.json({
      success: true,
      preview: true,
      email,
      episodeCount: preview.episodeCount,
      episodes: preview.episodes,
      subject: preview.subject,
      html: preview.html,
      text: preview.text,
      userData: preview.userData,
    });
  } catch (error) {
    console.error("[preview-digest] Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
