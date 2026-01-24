import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/serverAuth";
import { checkRateLimit, rateLimitResponse } from "@/lib/redis/ratelimit";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { libraryDeleteSchema } from "@/lib/validation/schemas";
import { logEvent } from "@/lib/logging";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ animeId: string }> }
) {
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

    // Parse params
    const { animeId } = await params;
    const parseResult = libraryDeleteSchema.safeParse({ animeId });
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid anime ID" }, { status: 400 });
    }

    const db = getAdminFirestore();
    await db
      .collection("users")
      .doc(uid)
      .collection("library")
      .doc(String(parseResult.data.animeId))
      .delete();

    logEvent.database("delete", "library", String(parseResult.data.animeId), {
      userId: uid,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete library entry error:", error);
    return NextResponse.json({ error: "Failed to delete library entry" }, { status: 500 });
  }
}
