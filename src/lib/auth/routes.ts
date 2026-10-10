import { getSafeRedirectPath, isAuthPath } from './redirect'

export const LOGIN_PATH = '/login'

export type AuthState = {
  isAuthenticated: boolean
  /** リクエストにログイン済みのトークンのCookieがあったか(セッション切れの判定に使う) */
  hasAuthCookie: boolean
}

/** Supabase のセッションのCookie(`sb-<ref>-auth-token` と、その分割 `.0` `.1` …)か */
export function isAuthTokenCookie(name: string): boolean {
  return /^sb-.+-auth-token(\.\d+)?$/.test(name)
}

/** 未ログインでも見られるパスか。ここにないパスは、すべて保護する */
export function isPublicPath(pathname: string): boolean {
  return isAuthPath(pathname)
}

export function buildLoginPath(next: string, reason?: 'expired'): string {
  const params = new URLSearchParams()
  if (next !== '/') params.set('next', next)
  if (reason) params.set('reason', reason)
  const query = params.toString()
  return query ? `${LOGIN_PATH}?${query}` : LOGIN_PATH
}

/**
 * 転送先のパスを返す。転送しないときは null。
 * - 未ログインで保護されたパス → ログイン画面(元のパスを next に残す)
 * - ログイン済みでログイン画面 → next(検証済み)か既定の画面
 */
export function decideAuthRedirect(url: URL, auth: AuthState): string | null {
  const { pathname, search, searchParams } = url

  if (auth.isAuthenticated) {
    if (pathname === LOGIN_PATH) return getSafeRedirectPath(searchParams.get('next'))
    return null
  }

  if (isPublicPath(pathname)) return null

  return buildLoginPath(`${pathname}${search}`, auth.hasAuthCookie ? 'expired' : undefined)
}
