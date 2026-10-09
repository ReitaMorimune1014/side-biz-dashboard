// @vitest-environment node
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SetAllCookies } from '@supabase/ssr'

type Claims = { sub: string } | null

const mock = vi.hoisted(() => ({
  claims: null as Claims,
  cookiesToSet: [] as Parameters<SetAllCookies>[0],
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: { cookies: { setAll: SetAllCookies } },
  ) => ({
    auth: {
      getClaims: async () => {
        if (mock.cookiesToSet.length > 0) {
          await options.cookies.setAll(mock.cookiesToSet, { 'Cache-Control': 'private, no-store' })
        }
        return { data: mock.claims ? { claims: mock.claims } : null, error: null }
      },
    },
  }),
}))

const { updateSession } = await import('./proxy')

function request(path: string, cookie?: string) {
  return new NextRequest(new URL(path, 'http://localhost:3000'), {
    headers: cookie ? { cookie } : {},
  })
}

describe('updateSession', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'test-key')
    mock.claims = null
    mock.cookiesToSet = []
  })

  it('未ログインで保護された画面に入ると、ログイン画面に移す', async () => {
    const response = await updateSession(request('/dashboard'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?next=%2Fdashboard',
    )
  })

  it('セッション切れのときは、Cookieを消す応答と一緒に再ログインを促す', async () => {
    mock.cookiesToSet = [{ name: 'sb-test-auth-token', value: '', options: { maxAge: 0 } }]

    const response = await updateSession(request('/dashboard', 'sb-test-auth-token=expired'))

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?next=%2Fdashboard&reason=expired',
    )
    expect(response.cookies.get('sb-test-auth-token')?.value).toBe('')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })

  it('ログイン済みなら通し、更新したトークンを応答に載せる', async () => {
    mock.claims = { sub: 'user-1' }
    mock.cookiesToSet = [{ name: 'sb-test-auth-token', value: 'refreshed', options: {} }]

    const response = await updateSession(request('/dashboard', 'sb-test-auth-token=old'))

    expect(response.headers.get('location')).toBeNull()
    expect(response.cookies.get('sb-test-auth-token')?.value).toBe('refreshed')
  })

  it('未ログインでもログイン画面には入れる', async () => {
    const response = await updateSession(request('/login'))

    expect(response.headers.get('location')).toBeNull()
  })

  it('ログイン済みでログイン画面に来たら、外部ではなく既定の画面に移す', async () => {
    mock.claims = { sub: 'user-1' }

    const response = await updateSession(request('/login?next=https%3A%2F%2Fevil.com'))

    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
  })
})
