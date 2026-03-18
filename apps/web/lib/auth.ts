import { auth } from "@/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.AUTH_SECRET!;

/**
 * Get authenticated user ID from session (Web) or Bearer token (Mobile).
 * Returns userId string or a 401 NextResponse.
 */
export async function getAuthUserId(): Promise<string | NextResponse> {
  const headersList = await headers();

  // Try Bearer token first (mobile)
  const authorization = headersList.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      if (payload.userId) return payload.userId;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  }

  // Fall back to cookie session (web)
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session.user.id;
}
