import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import { logEvent } from "@/lib/logging";

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
}

/**
 * Verifies if the request is from an authenticated admin user
 * Returns the admin user data if valid, null otherwise
 */
export async function verifyAdmin(request: NextRequest): Promise<AdminUser | null> {
  const endpoint = new URL(request.url).pathname;

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      logEvent.unauthorizedAccess(endpoint, "missing_token");
      return null;
    }

    const token = authHeader.split("Bearer ")[1];
    const auth = getAdminAuth();

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch {
      logEvent.unauthorizedAccess(endpoint, "invalid_token");
      return null;
    }

    // Check if user is admin in Firestore
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      logEvent.unauthorizedAccess(endpoint, "user_not_found", decodedToken.uid, {
        email: decodedToken.email,
      });
      return null;
    }

    const userData = userDoc.data();
    if (!userData?.isAdmin) {
      logEvent.unauthorizedAccess(endpoint, "not_admin", decodedToken.uid, {
        email: decodedToken.email,
      });
      return null;
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      displayName: userData.displayName || null,
      isAdmin: true,
    };
  } catch (error) {
    console.error("[verifyAdmin] Error:", error);
    logEvent.security("admin_auth_error", "medium", {
      endpoint,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Returns a 403 Forbidden response for non-admin users
 */
export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
}

/**
 * Returns a 401 Unauthorized response
 */
export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
