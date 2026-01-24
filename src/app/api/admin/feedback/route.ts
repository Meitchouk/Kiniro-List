import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { verifyAdmin, forbiddenResponse } from "@/lib/auth/adminAuth";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import type { FeedbackEntry, FeedbackStatus, FeedbackMessage } from "@/lib/types";
import { logEvent, withLogging } from "@/lib/logging";
import { sendFeedbackResponseEmail, sendFeedbackStatusChangeEmail } from "@/lib/email";
import { app } from "@/lib/config";
import type { Locale } from "@/lib/email/templates/base";

const updateFeedbackSchema = z.object({
  status: z.enum(["new", "in-review", "reviewed", "resolved"]).optional(),
  adminResponse: z
    .string()
    .min(1, "Response cannot be empty")
    .max(2000, "Response must be less than 2000 characters")
    .optional(),
});

/**
 * GET /api/admin/feedback
 * Gets all feedback entries (admin only)
 * Query params:
 * - countOnly=true: Only return counts for notifications
 * - status: Filter by status
 * - type: Filter by type
 * - limit: Max number of results
 */
export const GET = withLogging(
  async function GET(request: NextRequest) {
    try {
      const admin = await verifyAdmin(request);
      if (!admin) {
        return forbiddenResponse();
      }

      const db = getAdminFirestore();
      const { searchParams } = new URL(request.url);
      const countOnly = searchParams.get("countOnly") === "true";

      // For countOnly, just return the counts needed for notifications
      if (countOnly) {
        const allFeedback = await db.collection("feedback").get();

        let needsAttention = 0;
        let newCount = 0;
        let inReviewCount = 0;

        allFeedback.docs.forEach((doc) => {
          const data = doc.data();
          const status = data.status as FeedbackStatus;

          if (status === "new") {
            newCount++;
            needsAttention++;
          } else if (status === "in-review") {
            inReviewCount++;
            needsAttention++;
          }
        });

        return NextResponse.json({
          needsAttention,
          counts: {
            new: newCount,
            "in-review": inReviewCount,
          },
        });
      }

      // Optional filters
      const status = searchParams.get("status") as FeedbackStatus | null;
      const type = searchParams.get("type");
      const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

      let query = db.collection("feedback").orderBy("createdAt", "desc");

      if (status) {
        query = query.where("status", "==", status);
      }

      if (type) {
        query = query.where("type", "==", type);
      }

      const snapshot = await query.limit(limit).get();

      const feedback: FeedbackEntry[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userEmail: data.userEmail || null,
          userDisplayName: data.userDisplayName || null,
          type: data.type,
          message: data.message,
          status: data.status,
          adminResponse: data.adminResponse || null,
          thread: data.thread || [],
          hasUnreadResponse: data.hasUnreadResponse || false,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        };
      });

      // Get counts by status
      const countsSnapshot = await db.collection("feedback").get();
      const counts = {
        total: countsSnapshot.size,
        new: 0,
        "in-review": 0,
        reviewed: 0,
        resolved: 0,
      };

      countsSnapshot.docs.forEach((doc) => {
        const s = doc.data().status as FeedbackStatus;
        if (s in counts) {
          counts[s]++;
        }
      });

      return NextResponse.json({ feedback, counts });
    } catch (error) {
      console.error("[api/admin/feedback] GET Error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  { context: "admin:feedback" }
);

/**
 * PATCH /api/admin/feedback
 * Updates a feedback entry (status and/or admin response)
 */
export const PATCH = withLogging(
  async function PATCH(request: NextRequest) {
    try {
      const admin = await verifyAdmin(request);
      if (!admin) {
        return forbiddenResponse();
      }

      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return NextResponse.json({ error: "Feedback ID is required" }, { status: 400 });
      }

      const parsed = updateFeedbackSchema.parse(updateData);

      const db = getAdminFirestore();
      const feedbackRef = db.collection("feedback").doc(id);
      const feedbackDoc = await feedbackRef.get();

      if (!feedbackDoc.exists) {
        return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
      }

      const feedbackData = feedbackDoc.data()!;
      const previousStatus = feedbackData.status;
      const updatePayload: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Get user's preferred locale for emails
      let userLocale: Locale = "en";
      try {
        const userDoc = await db.collection("users").doc(feedbackData.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          userLocale =
            (userData?.settings?.locale as Locale) || (userData?.locale as Locale) || "en";
        }
      } catch (err) {
        console.error("[api/admin/feedback] Failed to get user locale:", err);
      }

      if (parsed.status) {
        updatePayload.status = parsed.status;
      }

      if (parsed.adminResponse) {
        // Create new message for thread
        const newMessage: FeedbackMessage = {
          id: `msg_${Date.now()}`,
          message: parsed.adminResponse,
          isAdmin: true,
          authorId: admin.uid,
          authorEmail: admin.email,
          authorName: "Admin",
          createdAt: new Date().toISOString(),
        };

        // Add to thread array
        const currentThread = feedbackData.thread || [];
        updatePayload.thread = [...currentThread, newMessage];

        // Keep legacy adminResponse for backward compatibility
        updatePayload.adminResponse = {
          message: parsed.adminResponse,
          respondedBy: admin.uid,
          respondedByEmail: admin.email,
          respondedAt: new Date().toISOString(),
        };

        // Mark as having unread response
        updatePayload.hasUnreadResponse = true;

        // Auto-set status to reviewed if responding
        if (!parsed.status) {
          updatePayload.status = "reviewed";
        }

        // Create in-app notification for the user
        const notificationRef = db
          .collection("users")
          .doc(feedbackData.userId)
          .collection("notifications")
          .doc();

        await notificationRef.set({
          type: "feedback_response",
          title: "New response to your feedback",
          message:
            parsed.adminResponse.substring(0, 100) +
            (parsed.adminResponse.length > 100 ? "..." : ""),
          data: {
            feedbackId: id,
          },
          read: false,
          createdAt: new Date(),
        });

        // Send email notification to user (async, don't block response)
        if (feedbackData.userEmail) {
          // Build thread for email (include the new message)
          const fullThread = (updatePayload.thread as FeedbackMessage[]).map((msg) => ({
            message: msg.message,
            isAdmin: msg.isAdmin,
            authorName: msg.authorName,
            createdAt: msg.createdAt,
          }));

          sendFeedbackResponseEmail(feedbackData.userEmail, {
            locale: userLocale,
            displayName: feedbackData.userDisplayName || null,
            feedbackType: feedbackData.type,
            originalMessage: feedbackData.message,
            adminResponse: parsed.adminResponse,
            feedbackUrl: `${app.baseUrl}/feedback`,
            thread: fullThread,
          }).catch((err) => console.error("[api/admin/feedback] Failed to send email:", err));
        }
      }

      // Create notification for status change (only if no response was sent, as response already creates notification)
      if (parsed.status && parsed.status !== previousStatus && !parsed.adminResponse) {
        const statusMessages: Record<string, string> = {
          "in-review": "Your feedback is now being reviewed",
          reviewed: "Your feedback has been reviewed",
          resolved: "Your feedback has been resolved",
        };

        const notificationMessage = statusMessages[parsed.status];
        if (notificationMessage) {
          const notificationRef = db
            .collection("users")
            .doc(feedbackData.userId)
            .collection("notifications")
            .doc();

          await notificationRef.set({
            type: "feedback_response",
            title: "Feedback status updated",
            message: notificationMessage,
            data: {
              feedbackId: id,
              newStatus: parsed.status,
            },
            read: false,
            createdAt: new Date(),
          });

          // Mark as having update so user sees it
          updatePayload.hasUnreadResponse = true;

          // Send email notification for status change
          if (feedbackData.userEmail) {
            sendFeedbackStatusChangeEmail(feedbackData.userEmail, {
              locale: userLocale,
              displayName: feedbackData.userDisplayName || null,
              feedbackType: feedbackData.type,
              originalMessage: feedbackData.message,
              newStatus: parsed.status as FeedbackStatus,
              feedbackUrl: `${app.baseUrl}/feedback`,
            }).catch((err) =>
              console.error("[api/admin/feedback] Failed to send status change email:", err)
            );
          }
        }
      }

      await feedbackRef.update(updatePayload);

      logEvent.admin(
        parsed.adminResponse ? "respond_feedback" : "update_feedback_status",
        admin.uid,
        id,
        {
          status: parsed.status || updatePayload.status,
          hasResponse: !!parsed.adminResponse,
        }
      );

      return NextResponse.json({
        success: true,
        message: "Feedback updated successfully",
      });
    } catch (error) {
      console.error("[api/admin/feedback] PATCH Error:", error);

      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        return NextResponse.json({ error: firstError.message }, { status: 400 });
      }

      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  { context: "admin:feedback" }
);
