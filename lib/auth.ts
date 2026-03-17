import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Get authenticated user ID from session.
 * Returns userId string or a 401 NextResponse.
 */
export async function getAuthUserId(): Promise<string | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session.user.id;
}
