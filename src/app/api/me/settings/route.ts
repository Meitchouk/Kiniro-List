import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/serverAuth";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { settingsUpdateSchema } from "@/lib/validation/schemas";

export async function PATCH(request: NextRequest) {
  try {
    // Authenticate
    let authResult;
    try {
      authResult = await requireAuth(request);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }
      throw error;
    }

    const { uid } = authResult;

    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, "user", uid);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Parse and validate body
    const body = await request.json();
    const parseResult = settingsUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid settings", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const updates = parseResult.data;

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (updates.timezone !== undefined) {
      updateData.timezone = updates.timezone;
    }
    if (updates.calendarView !== undefined) {
      updateData.calendarView = updates.calendarView;
    }
    if (updates.filters !== undefined) {
      updateData.filters = updates.filters;
    }
    if (updates.locale !== undefined) {
      updateData.locale = updates.locale;
    }
    if (updates.theme !== undefined) {
      updateData.theme = updates.theme;
    }

    // Update Firestore
    const db = getAdminFirestore();
    await db.collection("users").doc(uid).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
