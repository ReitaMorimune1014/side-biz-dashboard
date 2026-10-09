import { describe, expect, it } from 'vitest'
import { formatDateWithWeekday, todayInTokyo } from './date'

describe('todayInTokyo', () => {
  it('UTC では前日でも、日本時間の日付を返す', () => {
    // UTC 2026-10-09 15:30 = 日本時間 2026-10-10 00:30
    expect(todayInTokyo(new Date('2026-10-09T15:30:00Z'))).toBe('2026-10-10')
  })

  it('日本時間の 23:59 は、その日のまま', () => {
    expect(todayInTokyo(new Date('2026-10-10T14:59:00Z'))).toBe('2026-10-10')
  })
})

describe('formatDateWithWeekday', () => {
  it.each([
    ['2026-10-09', '2026/10/09(金)'],
    ['2026-10-12', '2026/10/12(月)'],
    ['2024-02-29', '2024/02/29(木)'],
  ])('%s は %s', (date, expected) => {
    expect(formatDateWithWeekday(date)).toBe(expected)
  })
})
