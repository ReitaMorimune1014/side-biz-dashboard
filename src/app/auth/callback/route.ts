import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_REDIRECT_PATH, getSafeRedirectPath } from "@/lib/auth/redirect";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // Cookie はこのホストに付くので、SITE_URL ではなくリクエストの origin へ移す
    if (!error) return NextResponse.redirect(new URL(next, origin));
    console.error("exchangeCodeForSession failed:", error.status, error.code);
  }

  const loginUrl = new URL(LOGIN_PATH, origin);
  loginUrl.searchParams.set("error", "link_invalid");
  if (next !== DEFAULT_REDIRECT_PATH) loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}
