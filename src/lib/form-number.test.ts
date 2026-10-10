import { describe, expect, it } from 'vitest'
import { wholeNumber, yenAmount } from './form-number'

const issue = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? undefined : result.error?.issues[0].message

describe('wholeNumber(0〜59)', () => {
  const schema = wholeNumber(59, '分は0〜59の整数で入力してください')

  it.each([
    ['30', 30],
    [' 7 ', 7],
    ['', 0],
    ['   ', 0],
    ['059', 59],
  ])('「%s」→ %i', (value, expected) => {
    expect(schema.parse(value)).toBe(expected)
  })

  it.each(['60', '-1', '1.5', 'abc', '１０', '12345'])('「%s」は拒否する', (value) => {
    expect(issue(schema.safeParse(value))).toBe('分は0〜59の整数で入力してください')
  })
})

describe('yenAmount(0〜999,999,999)', () => {
  const schema = yenAmount(0, 999_999_999)

  it.each([
    ['120000', 120000],
    ['120,000', 120000],
    [' 0 ', 0],
    ['999,999,999', 999_999_999],
  ])('「%s」→ %i', (value, expected) => {
    expect(schema.parse(value)).toBe(expected)
  })

  it('空なら、入力を求める', () => {
    expect(issue(schema.safeParse(''))).toBe('金額を入力してください')
    expect(issue(schema.safeParse(' , '))).toBe('金額を入力してください')
  })

  it.each(['-100', '1.5', '12万', '¥1000'])('「%s」は整数でないので拒否する', (value) => {
    expect(issue(schema.safeParse(value))).toBe('金額は0以上の整数(円)で入力してください')
  })

  it('上限を超えたら、上限を伝える', () => {
    expect(issue(schema.safeParse('1000000000'))).toBe('金額は999,999,999円以内で入力してください')
  })

  it('下限より小さければ拒否する', () => {
    expect(issue(yenAmount(1, 100).safeParse('0'))).toBe('金額は1以上の整数(円)で入力してください')
  })
})
