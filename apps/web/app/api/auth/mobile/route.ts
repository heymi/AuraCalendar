import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.AUTH_SECRET!;

/**
 * POST /api/auth/mobile
 * Receives GitHub OAuth code from mobile app, exchanges it for user info,
 * and returns a JWT for subsequent API calls.
 */
export async function POST(req: NextRequest) {
  const { code, code_verifier } = await req.json();
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  // Exchange code for GitHub access token (include code_verifier for PKCE)
  const body: Record<string, string> = {
    client_id: process.env.AUTH_GITHUB_MOBILE_ID!,
    client_secret: process.env.AUTH_GITHUB_MOBILE_SECRET!,
    code,
  };
  if (code_verifier) {
    body.code_verifier = code_verifier;
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    return NextResponse.json(
      { error: tokenData.error_description || tokenData.error },
      { status: 401 }
    );
  }

  const accessToken = tokenData.access_token;

  // Get GitHub user info
  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userRes.ok) {
    return NextResponse.json({ error: "Failed to fetch GitHub user" }, { status: 401 });
  }

  const ghUser = await userRes.json();
  const userId = String(ghUser.id);

  const token = jwt.sign(
    {
      userId,
      name: ghUser.login,
      avatar: ghUser.avatar_url,
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  return NextResponse.json({
    token,
    user: {
      id: userId,
      name: ghUser.login,
      avatar: ghUser.avatar_url,
    },
  });
}

/**
 * OPTIONS for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
