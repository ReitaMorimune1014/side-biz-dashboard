import { describe, expect, it } from 'vitest'
import { formatCompactYen, formatYen } from './money'

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

describe('formatCompactYen', () => {
  it.each([
    [9999, '9,999円'],
    [10000, '1万'],
    [125000, '12.5万'],
    [124949, '12.5万'],
    [1200000, '120万'],
    [123456789, '12,345.7万'],
  ])('%d を %s と表示する', (amount, expected) => {
    expect(formatCompactYen(amount)).toBe(expected)
  })
})
