import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const auth = {
  getClaims: vi.fn(),
  getUser: vi.fn(),
}
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth }),
}))

class RedirectError extends Error {
  constructor(readonly path: string) {
    super(`redirect:${path}`)
  }
}
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new RedirectError(path)
  },
}))

const { requireUser, verifySession, verifyWritableSession } = await import('./dal')

function claimsOf(appMetadata: unknown) {
  return { data: { claims: { sub: 'user-1', email: 'me@example.com', app_metadata: appMetadata } }, error: null }
}

function userOf(appMetadata: unknown) {
  return { data: { user: { id: 'user-1', app_metadata: appMetadata } }, error: null }
}

beforeEach(() => {
  auth.getClaims.mockReset()
  auth.getUser.mockReset()
})
afterEach(() => vi.clearAllMocks())

describe('verifySession', () => {
  it('閲覧専用かどうかを、JWT の app_metadata から返す', async () => {
    auth.getClaims.mockResolvedValue(claimsOf({ read_only: true }))
    await expect(verifySession()).resolves.toEqual({
      userId: 'user-1',
      email: 'me@example.com',
      readOnly: true,
    })
  })

  it('未ログインなら、ログイン画面へ', async () => {
    auth.getClaims.mockResolvedValue({ data: null, error: null })
    await expect(verifySession()).rejects.toThrow('redirect:/login')
  })
})

describe('verifyWritableSession(新規作成・編集の画面)', () => {
  it('閲覧専用なら、案内の画面へ', async () => {
    auth.getClaims.mockResolvedValue(claimsOf({ read_only: true }))
    await expect(verifyWritableSession()).rejects.toThrow('redirect:/read-only')
  })

  it('通常のアカウントなら、通す', async () => {
    auth.getClaims.mockResolvedValue(claimsOf({ provider: 'email' }))
    await expect(verifyWritableSession()).resolves.toMatchObject({ readOnly: false })
  })
})

describe('requireUser(データを書き換える Server Action)', () => {
  it('閲覧専用なら、書き換えずに案内の画面へ', async () => {
    auth.getUser.mockResolvedValue(userOf({ read_only: true }))
    await expect(requireUser()).rejects.toThrow('redirect:/read-only')
  })

  it('通常のアカウントなら、ユーザーを返す', async () => {
    auth.getUser.mockResolvedValue(userOf({ provider: 'email' }))
    await expect(requireUser()).resolves.toMatchObject({ id: 'user-1' })
  })

  it('未ログインなら、ログイン画面へ', async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })
    await expect(requireUser()).rejects.toThrow('redirect:/login')
  })
})
