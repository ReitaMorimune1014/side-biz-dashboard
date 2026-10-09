import { describe, expect, it } from 'vitest'
import { formatYen } from './money'

describe('formatYen', () => {
  it.each([
    [0, '0円'],
    [5000, '5,000円'],
    [120000, '120,000円'],
    [999999999, '999,999,999円'],
  ])('%d を %s と表示する', (amount, expected) => {
    expect(formatYen(amount)).toBe(expected)
  })

  it('小数は拒否する', () => {
    expect(() => formatYen(1.5)).toThrow(RangeError)
  })
})
