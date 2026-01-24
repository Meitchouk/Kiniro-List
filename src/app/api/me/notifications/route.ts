import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import { z } from "zod";
import type { UserNotification } from "@/lib/types";

const markReadSchema = z.object({
  notificationId: z.string().optional(),
  markAllRead: z.boolean().optional(),
});

/**
 * GET /api/me/notifications
 * Gets notifications for the authenticated user
 * Query params:
 * - countOnly=true: Only return unread count
 * - limit: Max number of notifications (default 50)
 */
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get("countOnly") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const db = getAdminFirestore();
    const notificationsRef = db
      .collection("users")
      .doc(decodedToken.uid)
      .collection("notifications");

    // For countOnly, just return unread count
    if (countOnly) {
      const unreadSnapshot = await notificationsRef.where("read", "==", false).count().get();

      return NextResponse.json({
        unreadCount: unreadSnapshot.data().count,
      });
    }

    // Get notifications
    const snapshot = await notificationsRef.orderBy("createdAt", "desc").limit(limit).get();

    const notifications: UserNotification[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: decodedToken.uid,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        read: data.read || false,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    // Get unread count
    const unreadSnapshot = await notificationsRef.where("read", "==", false).count().get();

    return NextResponse.json({
      notifications,
      unreadCount: unreadSnapshot.data().count,
    });
  } catch (error) {
    console.error("[api/me/notifications] GET Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/me/notifications
 * Mark notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { notificationId, markAllRead } = markReadSchema.parse(body);

    const db = getAdminFirestore();
    const notificationsRef = db
      .collection("users")
      .doc(decodedToken.uid)
      .collection("notifications");

    if (markAllRead) {
      // Mark all as read
      const unreadSnapshot = await notificationsRef.where("read", "==", false).get();

      const batch = db.batch();
      unreadSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();

      return NextResponse.json({
        success: true,
        markedCount: unreadSnapshot.size,
      });
    } else if (notificationId) {
      // Mark single notification as read
      await notificationsRef.doc(notificationId).update({ read: true });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("[api/me/notifications] PATCH Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/me/notifications
 * Delete old notifications (cleanup)
 */
export async function DELETE(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const deleteRead = searchParams.get("deleteRead") === "true";
    const notificationId = searchParams.get("id");

    const db = getAdminFirestore();
    const notificationsRef = db
      .collection("users")
      .doc(decodedToken.uid)
      .collection("notifications");

    if (notificationId) {
      // Delete single notification
      await notificationsRef.doc(notificationId).delete();
      return NextResponse.json({ success: true });
    }

    if (deleteRead) {
      // Delete all read notifications
      const readSnapshot = await notificationsRef.where("read", "==", true).get();

      const batch = db.batch();
      readSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      return NextResponse.json({
        success: true,
        deletedCount: readSnapshot.size,
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("[api/me/notifications] DELETE Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
