import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { verifyAdmin, forbiddenResponse } from "@/lib/auth/adminAuth";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import type { FeedbackEntry, FeedbackStatus } from "@/lib/types";
import { logEvent, withLogging } from "@/lib/logging";

const updateFeedbackSchema = z.object({
  status: z.enum(["new", "reviewed", "resolved"]).optional(),
  adminResponse: z
    .string()
    .min(1, "Response cannot be empty")
    .max(2000, "Response must be less than 2000 characters")
    .optional(),
});

/**
 * GET /api/admin/feedback
 * Gets all feedback entries (admin only)
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
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        };
      });

      // Get counts by status
      const countsSnapshot = await db.collection("feedback").get();
      const counts = {
        total: countsSnapshot.size,
        new: 0,
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

      const updatePayload: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (parsed.status) {
        updatePayload.status = parsed.status;
      }

      if (parsed.adminResponse) {
        updatePayload.adminResponse = {
          message: parsed.adminResponse,
          respondedBy: admin.uid,
          respondedByEmail: admin.email,
          respondedAt: new Date().toISOString(),
        };
        // Auto-set status to reviewed if responding
        if (!parsed.status) {
          updatePayload.status = "reviewed";
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
