import { describe, expect, it } from 'vitest'
import { DEFAULT_REDIRECT_PATH, getSafeRedirectPath } from './redirect'

describe('getSafeRedirectPath', () => {
  it.each([
    ['/dashboard', '/dashboard'],
    ['/clients?page=2', '/clients?page=2'],
    ['/projects/1#memo', '/projects/1#memo'],
    ['/%5Cevil.com', '/%5Cevil.com'],
  ])('同じサイト内の相対パス %s はそのまま通す', (input, expected) => {
    expect(getSafeRedirectPath(input)).toBe(expected)
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['空文字', ''],
    ['先頭が / でない', 'dashboard'],
    ['絶対URL', 'https://evil.com'],
    ['スキームだけ省いたURL', '//evil.com'],
    ['バックスラッシュを混ぜたURL', '/\\evil.com'],
    ['バックスラッシュ2つ', '\\\\evil.com'],
    ['javascript: スキーム', 'javascript:alert(1)'],
    ['タブで区切ったURL', '/\t/evil.com'],
    ['改行を含む', '/dashboard\n'],
    ['スラッシュが1つの絶対URL', 'http:/evil.com'],
    ['ログイン画面(ループ防止)', '/login'],
    ['ログイン画面の引数つき', '/login?next=/dashboard'],
    ['コールバック(ループ防止)', '/auth/callback?code=x'],
  ])('%s は既定の転送先にする', (_label, input) => {
    expect(getSafeRedirectPath(input)).toBe(DEFAULT_REDIRECT_PATH)
  })

  it('既定の転送先を指定できる', () => {
    expect(getSafeRedirectPath('https://evil.com', '/')).toBe('/')
  })
})
