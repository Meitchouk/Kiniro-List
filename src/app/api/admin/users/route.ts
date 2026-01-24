import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from "@/lib/auth/adminAuth";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { logEvent } from "@/lib/logging";

/**
 * GET /api/admin/users
 * Get all users with pagination and search
 */
export async function GET(request: NextRequest) {
  const adminUser = await verifyAdmin(request);

  if (!adminUser) {
    // Check if it's an auth issue or permission issue
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return unauthorizedResponse();
    }
    return forbiddenResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all"; // all, admin, verified

    const db = getAdminFirestore();
    const usersRef = db.collection("users");
    let query = usersRef.orderBy("createdAt", "desc");

    // Apply filters
    if (filter === "admin") {
      query = usersRef.where("isAdmin", "==", true).orderBy("createdAt", "desc");
    } else if (filter === "verified") {
      query = usersRef.where("emailVerified", "==", true).orderBy("createdAt", "desc");
    }

    // Get total count for pagination
    const countSnapshot = await query.count().get();
    const totalUsers = countSnapshot.data().count;

    // Apply pagination
    const offset = (page - 1) * limit;
    const snapshot = await query.limit(limit).offset(offset).get();

    const users = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || null,
        displayName: data.displayName || null,
        photoURL: data.photoURL || null,
        isAdmin: data.isAdmin || false,
        emailVerified: data.emailVerified || false,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || null,
        provider: data.provider || "unknown",
      };
    });

    // If search is provided, filter client-side (Firestore doesn't support partial text search)
    let filteredUsers = users;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = users.filter(
        (u: { email: string | null; displayName: string | null }) =>
          u.email?.toLowerCase().includes(searchLower) ||
          u.displayName?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users
 * Update user properties (e.g., toggle admin status)
 */
export async function PATCH(request: NextRequest) {
  const adminUser = await verifyAdmin(request);

  if (!adminUser) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return unauthorizedResponse();
    }
    return forbiddenResponse();
  }

  try {
    const body = await request.json();
    const { userId, isAdmin } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (typeof isAdmin !== "boolean") {
      return NextResponse.json({ error: "isAdmin must be a boolean" }, { status: 400 });
    }

    // Prevent admin from removing their own admin status
    if (userId === adminUser.uid && !isAdmin) {
      return NextResponse.json(
        { error: "Cannot remove your own admin privileges" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await userRef.update({
      isAdmin,
      updatedAt: new Date(),
      updatedBy: adminUser.uid,
    });

    // Log admin action
    logEvent.admin(isAdmin ? "grant_admin" : "revoke_admin", adminUser.uid, userId, {
      targetEmail: userDoc.data()?.email,
    });

    return NextResponse.json({
      success: true,
      message: isAdmin ? "Admin privileges granted" : "Admin privileges revoked",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
