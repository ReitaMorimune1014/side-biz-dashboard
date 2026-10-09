export const DEFAULT_REDIRECT_PATH = '/dashboard'

const BASE_ORIGIN = 'http://localhost'

function hasWhitespaceOrControl(value: string): boolean {
  if (/\s/.test(value)) return true
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if (code < 0x20 || code === 0x7f) return true
  }
  return false
}

export function isAuthPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/auth' ||
    pathname.startsWith('/auth/')
  )
}

/**
 * ログイン後の転送先として、同じサイト内の相対パスだけを返す。
 * 条件を満たさない値は、すべて fallback にする。
 */
export function getSafeRedirectPath(
  next: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT_PATH,
): string {
  if (typeof next !== 'string') return fallback
  if (!next.startsWith('/')) return fallback
  // ブラウザは "\" を "/" とみなすため、"/\evil.com" も "//evil.com" と同じく外部を指す
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback
  if (hasWhitespaceOrControl(next)) return fallback

  let url: URL
  try {
    url = new URL(next, BASE_ORIGIN)
  } catch {
    return fallback
  }
  if (url.origin !== BASE_ORIGIN) return fallback
  if (isAuthPath(url.pathname)) return fallback

  return `${url.pathname}${url.search}${url.hash}`
}
