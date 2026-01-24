import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, forbiddenResponse, unauthorizedResponse } from "@/lib/auth/adminAuth";
import { getAdminFirestore } from "@/lib/firebase/admin";

/**
 * GET /api/admin/users/stats
 * Get user statistics for admin dashboard
 */
export async function GET(request: NextRequest) {
  const adminUser = await verifyAdmin(request);

  if (!adminUser) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return unauthorizedResponse();
    }
    return forbiddenResponse();
  }

  try {
    const db = getAdminFirestore();
    const usersRef = db.collection("users");

    // Get total users count
    const totalSnapshot = await usersRef.count().get();
    const totalUsers = totalSnapshot.data().count;

    // Get admin users count
    const adminSnapshot = await usersRef.where("isAdmin", "==", true).count().get();
    const adminUsers = adminSnapshot.data().count;

    // Get verified users count
    const verifiedSnapshot = await usersRef.where("emailVerified", "==", true).count().get();
    const verifiedUsers = verifiedSnapshot.data().count;

    // Get users created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersSnapshot = await usersRef.where("createdAt", ">=", sevenDaysAgo).count().get();
    const newUsers = newUsersSnapshot.data().count;

    // Get users created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyUsersSnapshot = await usersRef
      .where("createdAt", ">=", thirtyDaysAgo)
      .count()
      .get();
    const monthlyUsers = monthlyUsersSnapshot.data().count;

    return NextResponse.json({
      stats: {
        totalUsers,
        adminUsers,
        verifiedUsers,
        newUsers,
        monthlyUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json({ error: "Failed to fetch user stats" }, { status: 500 });
  }
}
