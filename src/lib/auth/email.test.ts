import { describe, expect, it } from 'vitest'
import { isValidEmail, parseLoginEmail } from './email'

describe('isValidEmail', () => {
  it.each(['me@example.com', 'a.b+tag@sub.example.jp'])('%s は通す', (email) => {
    expect(isValidEmail(email)).toBe(true)
  })

  it.each(['', 'me', 'me@', '@example.com', 'me@example', 'me @example.com', 'me@@example.com'])(
    '%s は拒否する',
    (email) => {
      expect(isValidEmail(email)).toBe(false)
    },
  )

  it('254文字を超えるものは拒否する', () => {
    expect(isValidEmail(`${'a'.repeat(250)}@example.com`)).toBe(false)
  })
})

describe('parseLoginEmail', () => {
  it('前後の空白を除いて読む', () => {
    expect(parseLoginEmail('  me@example.com ')).toEqual({ success: true, data: 'me@example.com' })
  })

  it.each([undefined, '', '   '])('空(%s)なら、入力を求める', (value) => {
    expect(parseLoginEmail(value)).toEqual({
      success: false,
      fieldErrors: { email: 'メールアドレスを入力してください' },
    })
  })

  it('形式が違えば、そう伝える', () => {
    expect(parseLoginEmail('me@example')).toEqual({
      success: false,
      fieldErrors: { email: 'メールアドレスの形式が正しくありません' },
    })
  })
})
