import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/serverAuth";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { libraryUpsertSchema } from "@/lib/schemas";
import { getManyAnimeFromCache } from "@/lib/firestore/cache";
import type { LibraryEntry, LibraryEntryWithAnime } from "@/lib/types";

export async function GET(request: NextRequest) {
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

    const db = getAdminFirestore();
    const librarySnapshot = await db
      .collection("users")
      .doc(uid)
      .collection("library")
      .orderBy("updatedAt", "desc")
      .get();

    if (librarySnapshot.empty) {
      return NextResponse.json({ entries: [] });
    }

    // Get all library entries
    const entries: LibraryEntry[] = librarySnapshot.docs.map((doc) => {
      const data = doc.data() as LibraryEntry & {
        addedAt: Timestamp;
        updatedAt: Timestamp;
      };
      return {
        animeId: data.animeId,
        status: data.status,
        pinned: data.pinned,
        notes: data.notes,
        addedAt: data.addedAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
    });

    // Get anime metadata from cache
    const animeIds = entries.map((e) => e.animeId);
    const animeCache = await getManyAnimeFromCache(animeIds);

    // Join library entries with anime metadata
    const enrichedEntries: LibraryEntryWithAnime[] = entries
      .filter((e) => animeCache.has(e.animeId))
      .map((e) => ({
        ...e,
        anime: animeCache.get(e.animeId)!,
      }));

    return NextResponse.json({ entries: enrichedEntries });
  } catch (error) {
    console.error("Get library error:", error);
    return NextResponse.json({ error: "Failed to get library" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const parseResult = libraryUpsertSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid library entry", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { animeId, status, pinned, notes } = parseResult.data;

    const db = getAdminFirestore();
    const libraryRef = db
      .collection("users")
      .doc(uid)
      .collection("library")
      .doc(String(animeId));

    const existingDoc = await libraryRef.get();

    if (existingDoc.exists) {
      // Update existing entry
      const updateData: Record<string, unknown> = {
        status,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (pinned !== undefined) updateData.pinned = pinned;
      if (notes !== undefined) updateData.notes = notes;

      await libraryRef.update(updateData);
    } else {
      // Create new entry
      await libraryRef.set({
        animeId,
        status,
        pinned: pinned || false,
        notes: notes || "",
        addedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upsert library error:", error);
    return NextResponse.json({ error: "Failed to update library" }, { status: 500 });
  }
}
