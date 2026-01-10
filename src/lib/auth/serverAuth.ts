import { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { DecodedIdToken } from "firebase-admin/auth";

export interface AuthResult {
  uid: string;
  token: DecodedIdToken;
}

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError("Missing or invalid authorization header", 401);
  }

  const idToken = authHeader.substring(7);

  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    return {
      uid: decodedToken.uid,
      token: decodedToken,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    throw new AuthError("Invalid or expired token", 401);
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}
