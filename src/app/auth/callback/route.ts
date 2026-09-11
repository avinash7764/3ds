import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { loginWithGoogle, signInResponse } from "@/server/auth";

export const dynamic = "force-dynamic";

/**
 * GET /auth/callback
 * Handles Google's OAuth 2.0 redirect.
 * Exchanges code for userinfo, upserts student/admin record, sets session cookie,
 * and posts OAUTH_AUTH_SUCCESS to the opener window before closing the popup.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateParam = searchParams.get("state");

  let nextUrl = "/dashboard";
  if (stateParam) {
    try {
      const decoded = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf8"));
      if (decoded?.next && typeof decoded.next === "string" && decoded.next.startsWith("/")) {
        nextUrl = decoded.next;
      }
    } catch {
      // Ignore invalid state
    }
  }

  // Handle provider error (e.g., user clicked cancel on Google consent screen)
  if (error) {
    return renderPopupResult({
      ok: false,
      error: `Google authorization failed: ${error}`,
      nextUrl,
    });
  }

  if (!code) {
    return renderPopupResult({
      ok: false,
      error: "No authorization code was provided by Google.",
      nextUrl,
    });
  }

  if (!env.googleClientId) {
    return renderPopupResult({
      ok: false,
      error: "Google Client ID is not configured on this server.",
      nextUrl,
    });
  }

  try {
    const baseUrl = (env.appUrl || "http://localhost:3000").replace(/\/$/, "");
    const redirectUri = `${baseUrl}/auth/callback`;

    // Exchange authorization code for tokens
    const tokenRes = await fetch(env.googleTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.googleClientId,
        client_secret: env.googleClientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.text();
      console.error("Google token exchange error:", errData);
      return renderPopupResult({
        ok: false,
        error: "Failed to exchange authorization code with Google. Verify your client credentials and redirect URI.",
        nextUrl,
      });
    }

    const tokens = await tokenRes.json();
    const accessToken = tokens.access_token;
    const idToken = tokens.id_token;

    if (!accessToken && !idToken) {
      return renderPopupResult({
        ok: false,
        error: "Google did not return an access or ID token.",
        nextUrl,
      });
    }

    // Fetch user profile from Google UserInfo endpoint
    let claims: { sub: string; email: string; name?: string; picture?: string; email_verified?: boolean } | null = null;

    if (accessToken) {
      const userRes = await fetch(env.googleUserInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (userRes.ok) {
        claims = await userRes.json();
      }
    }

    // Fallback to decoding id_token if userInfo fails
    if (!claims && idToken) {
      try {
        const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64").toString("utf8"));
        claims = {
          sub: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          email_verified: payload.email_verified,
        };
      } catch {
        // failed decode
      }
    }

    if (!claims || !claims.email) {
      return renderPopupResult({
        ok: false,
        error: "Could not retrieve user email from Google account.",
        nextUrl,
      });
    }

    // Upsert user into database (signs in existing user or creates new student account)
    const user = loginWithGoogle({
      sub: claims.sub || claims.email,
      email: claims.email,
      name: claims.name || undefined,
      picture: claims.picture || undefined,
      email_verified: claims.email_verified,
    });

    const targetRedirect = user.role === "ADMIN" && nextUrl === "/dashboard" ? "/admin" : nextUrl;

    const response = renderPopupResult({
      ok: true,
      nextUrl: targetRedirect,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set authenticated session cookie
    response.cookies.set(signInResponse(user));
    return response;
  } catch (err) {
    console.error("Auth callback exception:", err);
    return renderPopupResult({
      ok: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred during Google sign-in.",
      nextUrl,
    });
  }
}

function renderPopupResult({
  ok,
  error,
  nextUrl,
  user,
}: {
  ok: boolean;
  error?: string;
  nextUrl: string;
  user?: { id: string; email: string; name: string | null; role: string };
}) {
  const payload = ok
    ? { type: "OAUTH_AUTH_SUCCESS", next: nextUrl, user }
    : { type: "OAUTH_AUTH_ERROR", error: error || "Authentication failed" };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${ok ? "Authentication Successful" : "Authentication Failed"}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 24px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #0b1120;
      color: #f8fafc;
    }
    .card {
      background: #1e293b;
      border: 1px solid ${ok ? "rgba(74, 222, 128, 0.2)" : "rgba(244, 63, 94, 0.2)"};
      border-radius: 16px;
      padding: 32px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: ${ok ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)"};
      color: ${ok ? "#4ade80" : "#f87171"};
      margin-bottom: 16px;
    }
    h1 {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 8px;
      color: #f8fafc;
    }
    p {
      font-size: 13.5px;
      color: #94a3b8;
      margin: 0 0 16px;
      line-height: 1.5;
    }
    .error-box {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 12.5px;
      color: #fca5a5;
      text-align: left;
      margin-bottom: 16px;
      word-break: break-word;
    }
    .btn {
      display: inline-block;
      background: #0ea5e9;
      color: #ffffff;
      font-weight: 600;
      font-size: 13px;
      padding: 10px 20px;
      border-radius: 8px;
      text-decoration: none;
      transition: background 0.15s;
    }
    .btn:hover {
      background: #0284c7;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      ${
        ok
          ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
          : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
      }
    </div>
    <h1>${ok ? "Sign-in Successful" : "Authentication Issue"}</h1>
    <p>${ok ? "You are now authenticated. Returning to 3DS Academy..." : "We could not complete Google authentication."}</p>
    ${error ? `<div class="error-box">${escapeHtml(error)}</div>` : ""}
    <script>
      (function() {
        var payload = ${JSON.stringify(payload)};
        if (window.opener) {
          try {
            window.opener.postMessage(payload, '*');
            setTimeout(function() { window.close(); }, 500);
          } catch(e) {
            console.error(e);
          }
        } else {
          setTimeout(function() {
            window.location.href = ${JSON.stringify(nextUrl)};
          }, 1000);
        }
      })();
    </script>
    <a href="${escapeHtml(nextUrl)}" class="btn" id="fallback-btn">${ok ? "Continue" : "Back to Sign In"}</a>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
