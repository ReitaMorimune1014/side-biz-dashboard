import { describe, expect, it } from 'vitest'
import { parseSettingsInput } from './schema'

const values = (overrides: Record<string, unknown> = {}) => ({
  hours: '5',
  minutes: '',
  week_start: '1',
  ...overrides,
})

describe('parseSettingsInput', () => {
  it('時間と分を、分の合計にする', () => {
    expect(parseSettingsInput(values({ hours: '7', minutes: '30', week_start: '0' }))).toEqual({
      success: true,
      data: { weekly_target_minutes: 450, week_start: 0 },
    })
  })

  it.each([
    ['', '1', 1],
    ['168', '0', 10080],
  ])('時間「%s」分「%s」は %i 分', (hours, minutes, expected) => {
    expect(parseSettingsInput(values({ hours, minutes }))).toMatchObject({
      success: true,
      data: { weekly_target_minutes: expected },
    })
  })

  it.each([
    ['0', '0', '目標時間を入力してください'],
    ['168', '1', '目標時間は168時間以内で入力してください'],
    ['169', '0', '時間は0〜168の整数で入力してください'],
    ['2.5', '0', '時間は0〜168の整数で入力してください'],
    ['1', '60', '分は0〜59の整数で入力してください'],
  ])('時間「%s」分「%s」は「%s」', (hours, minutes, message) => {
    expect(parseSettingsInput(values({ hours, minutes }))).toEqual({
      success: false,
      fieldErrors: { target: message },
    })
  })

  it.each(['', '7', '-1', '1.5', 'mon'])('開始曜日「%s」は拒否する', (week_start) => {
    expect(parseSettingsInput(values({ week_start }))).toEqual({
      success: false,
      fieldErrors: { week_start: '曜日を選んでください' },
    })
  })
})
