import { describe, expect, it } from 'vitest'
import { buildLoginPath, decideAuthRedirect, isAuthTokenCookie, isPublicPath } from './routes'

const url = (path: string) => new URL(path, 'http://localhost:3000')
const guest = { isAuthenticated: false, hasAuthCookie: false }
const expired = { isAuthenticated: false, hasAuthCookie: true }
const signedIn = { isAuthenticated: true, hasAuthCookie: true }

describe('isAuthTokenCookie', () => {
  it.each(['sb-abc-auth-token', 'sb-127-auth-token.0', 'sb-127-auth-token.12'])(
    '%s はセッションのCookie',
    (name) => {
      expect(isAuthTokenCookie(name)).toBe(true)
    },
  )

  it.each(['sb-abc-auth-token-code-verifier', 'session', 'sb-auth-token', 'x-sb-abc-auth-token'])(
    '%s はセッションのCookieではない',
    (name) => {
      expect(isAuthTokenCookie(name)).toBe(false)
    },
  )
})

describe('isPublicPath', () => {
  it.each(['/login', '/auth/callback'])('%s は公開', (path) => {
    expect(isPublicPath(path)).toBe(true)
  })

  it.each(['/', '/dashboard', '/clients', '/loginx', '/authority'])('%s は保護', (path) => {
    expect(isPublicPath(path)).toBe(false)
  })
})

describe('buildLoginPath', () => {
  it('元のパスを next に入れる', () => {
    expect(buildLoginPath('/clients?page=2')).toBe('/login?next=%2Fclients%3Fpage%3D2')
  })
  it('トップページは next を付けない', () => {
    expect(buildLoginPath('/')).toBe('/login')
  })
  it('セッション切れの理由を付ける', () => {
    expect(buildLoginPath('/dashboard', 'expired')).toBe('/login?next=%2Fdashboard&reason=expired')
  })
})

describe('decideAuthRedirect', () => {
  it('未ログインで保護された画面に入ると、ログイン画面に移す', () => {
    expect(decideAuthRedirect(url('/dashboard'), guest)).toBe('/login?next=%2Fdashboard')
  })

  it('クエリも含めて元のパスを残す', () => {
    expect(decideAuthRedirect(url('/clients?q=a&page=2'), guest)).toBe(
      '/login?next=%2Fclients%3Fq%3Da%26page%3D2',
    )
  })

  it('Cookieがあるのに無効なら、セッション切れとして再ログインを促す', () => {
    expect(decideAuthRedirect(url('/dashboard'), expired)).toBe(
      '/login?next=%2Fdashboard&reason=expired',
    )
  })

  it.each(['/login', '/login?next=%2Fclients', '/auth/callback?code=abc'])(
    '未ログインでも %s には入れる',
    (path) => {
      expect(decideAuthRedirect(url(path), guest)).toBeNull()
    },
  )

  it('ログイン済みなら保護された画面にそのまま入れる', () => {
    expect(decideAuthRedirect(url('/dashboard'), signedIn)).toBeNull()
  })

  it('ログイン済みでログイン画面に来たら、next の画面に移す', () => {
    expect(decideAuthRedirect(url('/login?next=%2Fclients'), signedIn)).toBe('/clients')
  })

  it('ログイン済みでも、外部の next には移さない', () => {
    expect(decideAuthRedirect(url('/login?next=%2F%2Fevil.com'), signedIn)).toBe('/dashboard')
  })
})
