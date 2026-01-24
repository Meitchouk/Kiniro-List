import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { logEvent } from "@/lib/logging";
import type { FeedbackMessage } from "@/lib/types";

const feedbackSchema = z.object({
  type: z.enum(["suggestion", "bug", "comment"]),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters"),
});

const replySchema = z.object({
  feedbackId: z.string().min(1),
  message: z
    .string()
    .min(1, "Message cannot be empty")
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

    logEvent.database("create", "feedback", feedbackRef.id, {
      userId: user.uid,
      type,
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
 * Query params:
 * - countOnly=true: Only return unread count (for notification badge)
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

    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get("countOnly") === "true";

    // Get user's feedback from Firestore
    const db = getAdminFirestore();

    // For countOnly, we only need to count unread items
    if (countOnly) {
      const unreadSnapshot = await db
        .collection("feedback")
        .where("userId", "==", decodedToken.uid)
        .where("hasUnreadResponse", "==", true)
        .get();

      return NextResponse.json({ unreadCount: unreadSnapshot.size });
    }

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
        adminResponse: data.adminResponse || null,
        thread: data.thread || [],
        hasUnreadResponse: data.hasUnreadResponse || false,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    // Count unread responses
    const unreadCount = feedback.filter((f) => f.hasUnreadResponse).length;

    return NextResponse.json({ feedback, unreadCount });
  } catch (error) {
    console.error("[api/feedback] GET Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/feedback
 * User replies to their feedback or marks as read.
 */
export async function PATCH(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(request, "user");
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const auth = getAdminAuth();

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await auth.getUser(decodedToken.uid);
    const body = await request.json();

    const db = getAdminFirestore();

    // Check if this is a mark-as-read request
    if (body.action === "markAsRead" && body.feedbackId) {
      const feedbackRef = db.collection("feedback").doc(body.feedbackId);
      const feedbackDoc = await feedbackRef.get();

      if (!feedbackDoc.exists) {
        return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
      }

      const feedbackData = feedbackDoc.data()!;
      if (feedbackData.userId !== decodedToken.uid) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await feedbackRef.update({
        hasUnreadResponse: false,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ success: true });
    }

    // Otherwise, it's a reply
    const { feedbackId, message } = replySchema.parse(body);

    const feedbackRef = db.collection("feedback").doc(feedbackId);
    const feedbackDoc = await feedbackRef.get();

    if (!feedbackDoc.exists) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    const feedbackData = feedbackDoc.data()!;
    if (feedbackData.userId !== decodedToken.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create new message for thread
    const newMessage: FeedbackMessage = {
      id: `msg_${Date.now()}`,
      message,
      isAdmin: false,
      authorId: user.uid,
      authorEmail: user.email || null,
      authorName: user.displayName || null,
      createdAt: new Date().toISOString(),
    };

    // Add to thread array
    const currentThread = feedbackData.thread || [];
    await feedbackRef.update({
      thread: [...currentThread, newMessage],
      updatedAt: FieldValue.serverTimestamp(),
      // Reset status to new when user replies (so admin sees it needs attention)
      status: feedbackData.status === "resolved" ? feedbackData.status : "new",
    });

    logEvent.database("update", "feedback", feedbackId, {
      userId: user.uid,
      action: "user_reply",
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error("[api/feedback] PATCH Error:", error);

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
