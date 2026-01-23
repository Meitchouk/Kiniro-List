import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { sendVerificationEmail } from "@/lib/email/sender";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";
import { z } from "zod";

const sendVerificationSchema = z.object({
  locale: z.enum(["en", "es"]).optional().default("en"),
});

/**
 * POST /api/auth/send-verification
 * Sends a verification email to the authenticated user.
 * Requires authentication token.
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit using email type (10 per minute)
    const rateLimit = await checkRateLimit(request, "email");
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    // Get authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const auth = getAdminAuth();

    // Verify the token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user from Firebase
    const user = await auth.getUser(decodedToken.uid);

    if (!user.email) {
      return NextResponse.json({ error: "User has no email" }, { status: 400 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { locale } = sendVerificationSchema.parse(body);

    // Generate verification link using Firebase Admin
    const verificationLink = await auth.generateEmailVerificationLink(user.email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://kinirolist.app"}/auth/verified`,
    });

    // Send email using our email service
    const result = await sendVerificationEmail({
      email: user.email,
      displayName: user.displayName || null,
      verificationLink,
      locale,
    });

    if (!result) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
    });
  } catch (error) {
    console.error("[api/auth/send-verification] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
