import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDemoAccount, isDemoMode } from './env'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getDemoAccount', () => {
  it('DEMO_MODE=true なら、デモのアカウントを返す', () => {
    vi.stubEnv('DEMO_MODE', 'true')
    vi.stubEnv('DEMO_EMAIL', 'demo@example.com')
    vi.stubEnv('DEMO_PASSWORD', 'secret')
    expect(getDemoAccount()).toEqual({ email: 'demo@example.com', password: 'secret' })
    expect(isDemoMode()).toBe(true)
  })

  it.each([undefined, '', 'false', '1', 'TRUE'])('DEMO_MODE=%s なら、デモではない', (value) => {
    vi.stubEnv('DEMO_MODE', value)
    vi.stubEnv('DEMO_EMAIL', 'demo@example.com')
    vi.stubEnv('DEMO_PASSWORD', 'secret')
    expect(getDemoAccount()).toBeNull()
    expect(isDemoMode()).toBe(false)
  })

  it.each([
    ['DEMO_EMAIL', 'DEMO_PASSWORD'],
    ['DEMO_PASSWORD', 'DEMO_EMAIL'],
  ])('DEMO_MODE=true で %s がないときは、設定の誤りとして止める', (missing, present) => {
    vi.stubEnv('DEMO_MODE', 'true')
    vi.stubEnv(missing, '')
    vi.stubEnv(present, 'value')
    expect(() => getDemoAccount()).toThrow('DEMO_EMAIL と DEMO_PASSWORD を設定してください')
  })
})
