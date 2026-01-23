import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";

const feedbackSchema = z.object({
  type: z.enum(["suggestion", "bug", "comment"]),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters"),
});

/**
 * POST /api/feedback
 * Creates a new feedback entry. Requires authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit (5 feedbacks per hour)
    const rateLimit = await checkRateLimit(request, "user");
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

    // Get user info
    const user = await auth.getUser(decodedToken.uid);

    // Parse request body
    const body = await request.json();
    const { type, message } = feedbackSchema.parse(body);

    // Save to Firestore
    const db = getAdminFirestore();
    const feedbackRef = db.collection("feedback").doc();

    await feedbackRef.set({
      id: feedbackRef.id,
      userId: user.uid,
      userEmail: user.email || null,
      userDisplayName: user.displayName || null,
      type,
      message,
      status: "new",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      id: feedbackRef.id,
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    console.error("[api/feedback] POST Error:", error);

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/feedback
 * Lists feedback entries for the authenticated user (their own feedback).
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get user's feedback from Firestore
    const db = getAdminFirestore();
    const feedbackSnapshot = await db
      .collection("feedback")
      .where("userId", "==", decodedToken.uid)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const feedback = feedbackSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        message: data.message,
        status: data.status,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("[api/feedback] GET Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
