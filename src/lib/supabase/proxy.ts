import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { decideAuthRedirect, isAuthTokenCookie } from '@/lib/auth/routes'
import { getSupabaseEnv } from '@/lib/env'

/**
 * トークンを更新し、更新後のCookieを応答に載せる。
 * 未ログインで保護されたパスに来たら、ログイン画面へ移す。
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const hasAuthCookie = request.cookies.getAll().some(({ name }) => isAuthTokenCookie(name))
  const { url, publishableKey } = getSupabaseEnv()

  let response = NextResponse.next({ request })
  let cacheHeaders: Record<string, string> = {}

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
        cacheHeaders = { ...cacheHeaders, ...headers }
      },
    },
  })

  // createServerClient と getClaims の間に処理を挟まない。挟むと、トークンの更新が応答に載らないことがある
  const { data } = await supabase.auth.getClaims()
  const isAuthenticated = Boolean(data?.claims)

  const redirectPath = decideAuthRedirect(request.nextUrl, { isAuthenticated, hasAuthCookie })
  const result = redirectPath
    ? NextResponse.redirect(new URL(redirectPath, request.nextUrl.origin))
    : response

  if (result !== response) {
    response.cookies.getAll().forEach((cookie) => result.cookies.set(cookie))
  }
  Object.entries(cacheHeaders).forEach(([key, value]) => result.headers.set(key, value))

  return result
}
