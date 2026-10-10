import { describe, expect, it } from 'vitest'
import { TIME_ENTRY_MEMO_MAX, isTimeEntryId, parseTimeEntryInput } from './schema'

const PROJECT_ID = '11111111-1111-4111-8111-111111111111'

const values = (overrides: Record<string, unknown> = {}) => ({
  project_id: PROJECT_ID,
  work_date: '2026-10-09',
  hours: '1',
  minutes: '30',
  memo: '',
  ...overrides,
})

describe('parseTimeEntryInput', () => {
  it('時間と分を、分の合計にする', () => {
    expect(parseTimeEntryInput(values())).toEqual({
      success: true,
      data: { project_id: PROJECT_ID, work_date: '2026-10-09', minutes: 90, memo: null },
    })
  })

  it.each([
    ['', '45', 45],
    ['2', '', 120],
    [' 0 ', ' 1 ', 1],
    ['24', '0', 1440],
  ])('時間「%s」分「%s」は %i 分', (hours, minutes, expected) => {
    const result = parseTimeEntryInput(values({ hours, minutes }))
    expect(result).toMatchObject({ success: true, data: { minutes: expected } })
  })

  it.each([
    ['0', '0', '稼働時間を入力してください'],
    ['', '', '稼働時間を入力してください'],
    ['24', '1', '稼働時間は24時間以内で入力してください'],
    ['25', '0', '時間は0〜24の整数で入力してください'],
    ['1.5', '0', '時間は0〜24の整数で入力してください'],
    ['-1', '0', '時間は0〜24の整数で入力してください'],
    ['1', '60', '分は0〜59の整数で入力してください'],
    ['1', 'abc', '分は0〜59の整数で入力してください'],
  ])('時間「%s」分「%s」は「%s」', (hours, minutes, message) => {
    expect(parseTimeEntryInput(values({ hours, minutes }))).toEqual({
      success: false,
      fieldErrors: { duration: message },
    })
  })

  it('未来の日付も記録できる', () => {
    const result = parseTimeEntryInput(values({ work_date: '2099-12-31' }))
    expect(result.success).toBe(true)
  })

  it.each(['', '2026-02-30', '2026/10/09', 'today'])('日付「%s」は拒否する', (work_date) => {
    expect(parseTimeEntryInput(values({ work_date }))).toEqual({
      success: false,
      fieldErrors: { work_date: '日付を正しく入力してください' },
    })
  })

  it.each(['', 'not-a-uuid'])('案件「%s」は拒否する', (project_id) => {
    expect(parseTimeEntryInput(values({ project_id }))).toEqual({
      success: false,
      fieldErrors: { project_id: '案件を選んでください' },
    })
  })

  it('メモは上限まで受け付け、超えたら拒否する', () => {
    const max = 'あ'.repeat(TIME_ENTRY_MEMO_MAX)
    expect(parseTimeEntryInput(values({ memo: max }))).toMatchObject({
      success: true,
      data: { memo: max },
    })
    expect(parseTimeEntryInput(values({ memo: `${max}あ` }))).toEqual({
      success: false,
      fieldErrors: { memo: 'メモは2000文字以内で入力してください' },
    })
  })

  it('複数の欄の誤りを、まとめて返す', () => {
    const result = parseTimeEntryInput({ project_id: '', work_date: '', hours: 'x', minutes: '' })
    expect(result).toEqual({
      success: false,
      fieldErrors: {
        project_id: '案件を選んでください',
        work_date: '日付を正しく入力してください',
        duration: '時間は0〜24の整数で入力してください',
      },
    })
  })
})

describe('isTimeEntryId', () => {
  it('UUID だけを受け付ける', () => {
    expect(isTimeEntryId(PROJECT_ID)).toBe(true)
    expect(isTimeEntryId('1')).toBe(false)
  })
})
