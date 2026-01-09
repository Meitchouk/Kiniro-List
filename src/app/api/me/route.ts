import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/serverAuth";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { UserDocument, UserResponse } from "@/lib/types";

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

    const { uid, token } = authResult;

    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, "user", uid);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const db = getAdminFirestore();
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create new user with defaults
      const timezone = request.headers.get("x-timezone") || "UTC";
      const locale = request.headers.get("x-locale") || "en";
      const theme = request.headers.get("x-theme") || "system";

      const newUser: Omit<UserDocument, "createdAt" | "updatedAt"> & {
        createdAt: FieldValue;
        updatedAt: FieldValue;
      } = {
        uid,
        displayName: token.name || null,
        photoURL: token.picture || null,
        email: token.email || null,
        timezone,
        calendarView: "weekly",
        filters: {
          hideAdult: true,
          onlyWatching: true,
        },
        locale: locale === "es" ? "es" : "en",
        theme: theme === "light" || theme === "dark" ? theme : "system",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await userRef.set(newUser);

      const response: UserResponse = {
        uid,
        displayName: newUser.displayName,
        photoURL: newUser.photoURL,
        email: newUser.email,
        timezone: newUser.timezone,
        calendarView: newUser.calendarView,
        filters: newUser.filters,
        locale: newUser.locale,
        theme: newUser.theme,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json(response);
    }

    // Return existing user
    const userData = userDoc.data() as UserDocument & {
      createdAt: Timestamp;
      updatedAt: Timestamp;
    };

    const response: UserResponse = {
      uid: userData.uid,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      email: userData.email,
      timezone: userData.timezone,
      calendarView: userData.calendarView,
      filters: userData.filters,
      locale: userData.locale,
      theme: userData.theme,
      createdAt: userData.createdAt.toDate().toISOString(),
      updatedAt: userData.updatedAt.toDate().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}
