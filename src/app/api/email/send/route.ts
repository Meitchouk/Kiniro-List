import { NextRequest, NextResponse } from "next/server";
import { emailSendSchema } from "@/lib/validation/schemas";
import { sendEmail } from "@/lib/email/zeptomail";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";

export const runtime = "nodejs";

/**
 * POST /api/email/send
 * Protected endpoint to send transactional emails via SMTP.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit email sends
    const rate = await checkRateLimit(request, "email");
    if (!rate.success) {
      return rateLimitResponse(rate);
    }

    const body = await request.json();
    const parsed = emailSendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await sendEmail(parsed.data);
    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error("[email] send error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
