import { describe, expect, it } from 'vitest'
import { isWeekday, weekRange } from './week'

describe('weekRange(月曜始まり)', () => {
  // 2026-10-05 は月曜、2026-10-11 は日曜
  it.each([
    ['2026-10-05', '2026-10-05', '2026-10-11'],
    ['2026-10-09', '2026-10-05', '2026-10-11'],
    ['2026-10-11', '2026-10-05', '2026-10-11'],
    ['2026-10-12', '2026-10-12', '2026-10-18'],
  ])('%s の週は %s〜%s', (today, start, end) => {
    expect(weekRange(today, 1)).toEqual({ start, end })
  })
})

describe('weekRange(日曜始まり)', () => {
  it.each([
    ['2026-10-04', '2026-10-04', '2026-10-10'],
    ['2026-10-10', '2026-10-04', '2026-10-10'],
    ['2026-10-11', '2026-10-11', '2026-10-17'],
  ])('%s の週は %s〜%s', (today, start, end) => {
    expect(weekRange(today, 0)).toEqual({ start, end })
  })
})

describe('weekRange(月・年をまたぐ)', () => {
  it('月曜始まりで、2026-12-31(木)の週は 12-28〜01-03', () => {
    expect(weekRange('2026-12-31', 1)).toEqual({ start: '2026-12-28', end: '2027-01-03' })
  })

  it('土曜始まりで、2024-03-01(金)の週は うるう日を含む 02-24〜03-01', () => {
    expect(weekRange('2024-03-01', 6)).toEqual({ start: '2024-02-24', end: '2024-03-01' })
  })
})

describe('isWeekday', () => {
  it.each([0, 1, 6])('%i は曜日', (value) => {
    expect(isWeekday(value)).toBe(true)
  })

  it.each([-1, 7, 1.5, '1', null])('%s は曜日ではない', (value) => {
    expect(isWeekday(value)).toBe(false)
  })
})
