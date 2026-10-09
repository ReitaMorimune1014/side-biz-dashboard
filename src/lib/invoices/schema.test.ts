import { describe, expect, it } from 'vitest'
import { isInvoiceId, parseInvoiceInput, parsePaidOn } from './schema'

const PROJECT_ID = '11111111-1111-4111-8111-111111111111'

const values = (overrides: Record<string, unknown> = {}) => ({
  project_id: PROJECT_ID,
  amount: '120,000',
  issued_on: '2026-10-01',
  due_on: '2026-10-31',
  paid_on: '',
  ...overrides,
})

describe('parseInvoiceInput', () => {
  it('カンマ区切りの金額を整数にし、空の入金日は null にする', () => {
    expect(parseInvoiceInput(values())).toEqual({
      success: true,
      data: {
        project_id: PROJECT_ID,
        amount: 120000,
        issued_on: '2026-10-01',
        due_on: '2026-10-31',
        paid_on: null,
      },
    })
  })

  it('支払期限と入金日は、発行日と同じ日でもよい', () => {
    const result = parseInvoiceInput(values({ due_on: '2026-10-01', paid_on: '2026-10-01' }))
    expect(result).toMatchObject({ success: true, data: { due_on: '2026-10-01', paid_on: '2026-10-01' } })
  })

  it.each([
    ['', '金額を入力してください'],
    ['0', '金額は1以上の整数(円)で入力してください'],
    ['-1', '金額は1以上の整数(円)で入力してください'],
    ['1.5', '金額は1以上の整数(円)で入力してください'],
    ['1000000000', '金額は999,999,999円以内で入力してください'],
  ])('金額「%s」は「%s」', (amount, message) => {
    expect(parseInvoiceInput(values({ amount }))).toEqual({
      success: false,
      fieldErrors: { amount: message },
    })
  })

  it('支払期限が発行日より前なら拒否する', () => {
    expect(parseInvoiceInput(values({ due_on: '2026-09-30' }))).toEqual({
      success: false,
      fieldErrors: { due_on: '支払期限は発行日以降にしてください' },
    })
  })

  it('入金日が発行日より前なら拒否する', () => {
    expect(parseInvoiceInput(values({ paid_on: '2026-09-30' }))).toEqual({
      success: false,
      fieldErrors: { paid_on: '入金日は発行日以降にしてください' },
    })
  })

  it('日付の形が正しくなければ、欄ごとに返す', () => {
    expect(
      parseInvoiceInput(values({ issued_on: '', due_on: '2026-02-30', paid_on: 'x', project_id: '' })),
    ).toEqual({
      success: false,
      fieldErrors: {
        project_id: '案件を選んでください',
        issued_on: '発行日を正しく入力してください',
        due_on: '支払期限を正しく入力してください',
        paid_on: '入金日を正しく入力してください',
      },
    })
  })
})

describe('parsePaidOn', () => {
  it('発行日以降の日付を受け付ける', () => {
    expect(parsePaidOn('2026-10-01', '2026-10-01')).toEqual({ success: true, data: '2026-10-01' })
  })

  it('発行日より前は拒否する', () => {
    expect(parsePaidOn('2026-09-30', '2026-10-01')).toEqual({
      success: false,
      message: '入金日は発行日以降にしてください',
    })
  })

  it.each(['', '2026-13-01', null])('「%s」は拒否する', (value) => {
    expect(parsePaidOn(value, '2026-10-01')).toEqual({
      success: false,
      message: '入金日を正しく入力してください',
    })
  })
})

describe('isInvoiceId', () => {
  it('UUID だけを受け付ける', () => {
    expect(isInvoiceId(PROJECT_ID)).toBe(true)
    expect(isInvoiceId('x')).toBe(false)
  })
})
