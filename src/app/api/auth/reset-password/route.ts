import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { sendPasswordResetEmail } from "@/lib/email/sender";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";
import { z } from "zod";

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  locale: z.enum(["en", "es"]).optional().default("en"),
});

/**
 * POST /api/auth/reset-password
 * Sends a password reset email to the specified email address.
 * Does not require authentication (user forgot their password).
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit using email type (10 per minute)
    const rateLimit = await checkRateLimit(request, "email");
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    // Parse request body
    const body = await request.json();
    const { email, locale } = resetPasswordSchema.parse(body);

    const auth = getAdminAuth();

    // Try to get user by email (to get display name)
    // We don't reveal if user exists or not for security
    let displayName: string | null = null;
    try {
      const user = await auth.getUserByEmail(email);
      displayName = user.displayName || null;

      // Check if user signed up with Google (no password)
      const hasPasswordProvider = user.providerData.some(
        (provider) => provider.providerId === "password"
      );

      if (!hasPasswordProvider) {
        // User exists but signed up with Google
        // We still return success to not reveal account info
        console.log(`[api/auth/reset-password] User ${email} has no password provider`);
        return NextResponse.json({
          success: true,
          message: "If an account exists, a reset email will be sent",
        });
      }
    } catch {
      // User doesn't exist - return success anyway to not reveal if email is registered
      console.log(`[api/auth/reset-password] User ${email} not found`);
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset email will be sent",
      });
    }

    // Generate password reset link using Firebase Admin
    const resetLink = await auth.generatePasswordResetLink(email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://kinirolist.app"}/auth/reset-complete`,
    });

    // Send email using our email service
    const result = await sendPasswordResetEmail({
      email,
      displayName,
      resetLink,
      locale,
    });

    if (!result) {
      // Log error but don't reveal to user
      console.error(`[api/auth/reset-password] Failed to send email to ${email}`);
    }

    // Always return success to not reveal if email exists
    return NextResponse.json({
      success: true,
      message: "If an account exists, a reset email will be sent",
    });
  } catch (error) {
    console.error("[api/auth/reset-password] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
