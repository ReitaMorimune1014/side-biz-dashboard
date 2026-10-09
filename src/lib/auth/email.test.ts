import { describe, expect, it } from 'vitest'
import { isValidEmail } from './email'

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
