import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Let all API requests pass through — auth is handled in route handlers
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
