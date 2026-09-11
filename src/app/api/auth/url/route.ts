import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/url
 * Returns Google OAuth 2.0 authorization URL for popup-based authentication.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const next = searchParams.get("next") || "/dashboard";

  // Check if Google credentials are configured
  if (!env.googleConfigured || !env.googleClientId) {
    return NextResponse.json({
      configured: false,
      error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.",
      allowDemo: env.allowDemoLogin,
    });
  }

  // Use APP_URL per oauth-integration guidelines
  const baseUrl = (env.appUrl || "http://localhost:3000").replace(/\/$/, "");
  const redirectUri = `${baseUrl}/auth/callback`;

  // Encode the target redirect destination in the OAuth state parameter
  const state = Buffer.from(JSON.stringify({ next, timestamp: Date.now() })).toString("base64url");

  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  const providerAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const authUrl = `${providerAuthUrl}?${params.toString()}`;

  return NextResponse.json({
    configured: true,
    url: authUrl,
    redirectUri,
  });
}
