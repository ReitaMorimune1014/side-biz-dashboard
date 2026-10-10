import { describe, expect, it } from 'vitest'
import {
  PROJECT_AMOUNT_MAX,
  PROJECT_MEMO_MAX,
  PROJECT_TITLE_MAX,
  isProjectId,
  parseEarnedOn,
  parseProjectEdit,
  parseProjectInput,
  parseStatusChange,
  readProjectForm,
} from './schema'

describe('parseEarnedOn', () => {
  it('日付を読み、空なら null にする', () => {
    expect(parseEarnedOn({ earned_on: '2026-10-10' })).toEqual({ success: true, data: '2026-10-10' })
    expect(parseEarnedOn({ earned_on: ' ' })).toEqual({ success: true, data: null })
    expect(parseEarnedOn({})).toEqual({ success: true, data: null })
  })

  it.each(['2026-02-30', '2026/10/10'])('「%s」は拒否する', (earned_on) => {
    expect(parseEarnedOn({ earned_on })).toEqual({
      success: false,
      fieldErrors: { earned_on: '売上日は正しい日付で入力してください' },
    })
  })
})

const CUSTOMER_ID = '3f1c2b7e-8a4d-4c1e-9b2f-1a2b3c4d5e6f'

const valid = {
  customer_id: CUSTOMER_ID,
  title: 'LP制作',
  amount: '120000',
  due_date: '2026-10-31',
  memo: '',
}

function fieldErrorOf(values: Record<string, unknown>, field: string) {
  const result = parseProjectInput(values)
  return result.success ? undefined : result.fieldErrors[field as keyof typeof result.fieldErrors]
}

describe('parseProjectInput', () => {
  it('正しい入力を、保存用の値に変換する', () => {
    expect(parseProjectInput({ ...valid, title: '  LP制作  ' })).toEqual({
      success: true,
      data: {
        customer_id: CUSTOMER_ID,
        title: 'LP制作',
        amount: 120000,
        due_date: '2026-10-31',
        memo: null,
      },
    })
  })

  describe('顧客', () => {
    it.each(['', 'abc', null])('%s は拒否する', (customerId) => {
      expect(fieldErrorOf({ ...valid, customer_id: customerId }, 'customer_id')).toBe(
        '顧客を選んでください',
      )
    })
  })

  describe('題名', () => {
    it('空白だけは拒否する', () => {
      expect(fieldErrorOf({ ...valid, title: '  ' }, 'title')).toBe('題名を入力してください')
    })

    it(`${PROJECT_TITLE_MAX}文字までは通し、それを超えたら拒否する`, () => {
      expect(parseProjectInput({ ...valid, title: 'あ'.repeat(PROJECT_TITLE_MAX) }).success).toBe(true)
      expect(fieldErrorOf({ ...valid, title: 'あ'.repeat(PROJECT_TITLE_MAX + 1) }, 'title')).toBeDefined()
    })
  })

  describe('金額', () => {
    it.each([
      ['0', 0],
      ['120000', 120000],
      ['120,000', 120000],
      [' 5000 ', 5000],
      [String(PROJECT_AMOUNT_MAX), PROJECT_AMOUNT_MAX],
    ])('%s は %d 円として通す', (input, expected) => {
      const result = parseProjectInput({ ...valid, amount: input })
      expect(result.success && result.data.amount).toBe(expected)
    })

    it('空は拒否する', () => {
      expect(fieldErrorOf({ ...valid, amount: '' }, 'amount')).toBe('金額を入力してください')
    })

    it.each(['-1', '1.5', '1e3', 'abc', '１０００'])('%s は拒否する(整数の円だけ)', (input) => {
      expect(fieldErrorOf({ ...valid, amount: input }, 'amount')).toBe(
        '金額は0以上の整数(円)で入力してください',
      )
    })

    it('上限を超えたら拒否する', () => {
      expect(fieldErrorOf({ ...valid, amount: String(PROJECT_AMOUNT_MAX + 1) }, 'amount')).toBeDefined()
      expect(fieldErrorOf({ ...valid, amount: '9'.repeat(30) }, 'amount')).toBeDefined()
    })
  })

  describe('納期', () => {
    it('空は未定(null)にする', () => {
      const result = parseProjectInput({ ...valid, due_date: '' })
      expect(result.success && result.data.due_date).toBeNull()
    })

    it('うるう年の2月29日は通す', () => {
      expect(parseProjectInput({ ...valid, due_date: '2028-02-29' }).success).toBe(true)
    })

    it.each(['2026-02-30', '2027-02-29', '2026-13-01', '2026/10/31', '20261031'])(
      '%s は拒否する',
      (input) => {
        expect(fieldErrorOf({ ...valid, due_date: input }, 'due_date')).toBe(
          '納期は正しい日付で入力してください',
        )
      },
    )
  })

  describe('メモ', () => {
    it(`${PROJECT_MEMO_MAX}文字を超えたら拒否する`, () => {
      expect(fieldErrorOf({ ...valid, memo: 'a'.repeat(PROJECT_MEMO_MAX + 1) }, 'memo')).toBeDefined()
    })
  })

  it('複数の項目のエラーを、項目ごとに返す', () => {
    const result = parseProjectInput({ ...valid, title: '', amount: 'abc' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual(['amount', 'title'])
    }
  })
})

describe('parseStatusChange', () => {
  it('開いたときの状態から、選んだ状態への変更として読む', () => {
    expect(parseStatusChange({ status: 'ordered', expected_status: 'estimate' })).toEqual({
      success: true,
      data: { from: 'estimate', to: 'ordered' },
    })
  })

  it.each([
    [{ status: 'cancelled', expected_status: 'estimate' }],
    [{ status: 'ordered', expected_status: '' }],
    [{}],
  ])('不正な値 %o は拒否する', (values) => {
    expect(parseStatusChange(values).success).toBe(false)
  })
})

describe('parseProjectEdit', () => {
  const edit = { ...valid, status: 'delivered', expected_status: 'in_progress', earned_on: '' }

  it('項目・状態の変更・売上日をまとめて読む', () => {
    expect(parseProjectEdit(edit)).toEqual({
      success: true,
      data: {
        input: { customer_id: CUSTOMER_ID, title: 'LP制作', amount: 120000, due_date: '2026-10-31', memo: null },
        change: { from: 'in_progress', to: 'delivered' },
        earnedOn: null,
      },
    })
  })

  it('3つのエラーを、項目ごとにまとめて返す', () => {
    expect(parseProjectEdit({ ...edit, title: '', status: 'unknown', earned_on: '2026-02-30' })).toEqual({
      success: false,
      fieldErrors: {
        title: '題名を入力してください',
        status: '状態を選んでください',
        earned_on: '売上日は正しい日付で入力してください',
      },
    })
  })
})

describe('readProjectForm', () => {
  it('案件の項目と、開いたときの状態を読む', () => {
    const formData = new FormData()
    formData.set('title', 'LP制作')
    formData.set('expected_status', 'estimate')

    expect(readProjectForm(formData)).toEqual({
      customer_id: '',
      title: 'LP制作',
      amount: '',
      due_date: '',
      memo: '',
      status: '',
      earned_on: '',
      expected_status: 'estimate',
    })
  })
})

describe('isProjectId', () => {
  it('UUID だけを通す', () => {
    expect(isProjectId(CUSTOMER_ID)).toBe(true)
    expect(isProjectId('1')).toBe(false)
  })
})
