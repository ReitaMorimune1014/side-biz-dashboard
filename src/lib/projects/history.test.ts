import { describe, expect, it } from 'vitest'
import {
  describeHistory,
  formatHistoryValue,
  historyCustomerIds,
  parseHistoryChanges,
  type CustomerNames,
  type ProjectHistoryEntry,
} from './history'

const CUSTOMER_A = '11111111-1111-4111-8111-111111111111'
const CUSTOMER_B = '22222222-2222-4222-8222-222222222222'

const customers: CustomerNames = new Map([
  [CUSTOMER_A, { name: '山田商店', deleted: false }],
  [CUSTOMER_B, { name: '旧顧客', deleted: true }],
])

function entry(overrides: Partial<ProjectHistoryEntry>): ProjectHistoryEntry {
  return { id: 1, operation: 'update', changedAt: '2026-10-09T09:00:00Z', changes: {}, ...overrides }
}

describe('parseHistoryChanges', () => {
  it('記録する項目だけを読み、変更前・変更後のない値は null にする', () => {
    expect(
      parseHistoryChanges({
        title: { before: 'a', after: 'b' },
        memo: { after: 'メモ' },
        user_id: { before: 'x', after: 'y' },
        amount: 'broken',
      }),
    ).toEqual({
      title: { before: 'a', after: 'b' },
      memo: { before: null, after: 'メモ' },
    })
  })

  it.each([null, 'text', 1, []])('形が違う値 %j は、空にする', (value) => {
    expect(parseHistoryChanges(value)).toEqual({})
  })
})

describe('formatHistoryValue', () => {
  it.each([
    ['status', 'in_progress', '進行'],
    ['status', 'unknown', 'unknown'],
    ['amount', 120000, '120,000円'],
    ['due_date', '2026-10-20', '2026/10/20'],
    ['due_date', null, '未定'],
    ['earned_on', null, 'なし'],
    ['memo', null, 'なし'],
    ['memo', '', 'なし'],
    ['memo', '1行目\n2行目', '1行目\n2行目'],
    ['title', 'ロゴ制作', 'ロゴ制作'],
    ['customer_id', CUSTOMER_A, '山田商店'],
    ['customer_id', CUSTOMER_B, '旧顧客(削除済み)'],
    ['customer_id', '33333333-3333-4333-8333-333333333333', '(不明な顧客)'],
  ] as const)('%s の %j は「%s」', (field, value, expected) => {
    expect(formatHistoryValue(field, value, customers)).toBe(expected)
  })
})

describe('describeHistory', () => {
  it('変更は、項目ごとに変更前と変更後を、決まった順で出す', () => {
    const result = describeHistory(
      entry({
        changes: {
          memo: { before: null, after: '修正2回まで' },
          amount: { before: 100000, after: 120000 },
          status: { before: 'ordered', after: 'in_progress' },
        },
      }),
      customers,
    )
    expect(result).toEqual({
      operation: '変更',
      lines: [
        { field: 'status', label: '状態', before: '受注', after: '進行' },
        { field: 'amount', label: '金額', before: '100,000円', after: '120,000円' },
        { field: 'memo', label: 'メモ', before: 'なし', after: '修正2回まで' },
      ],
    })
  })

  it('作成は、変更前を出さない', () => {
    const result = describeHistory(
      entry({
        operation: 'create',
        changes: {
          title: { before: null, after: 'LP制作' },
          customer_id: { before: null, after: CUSTOMER_A },
          status: { before: null, after: 'estimate' },
        },
      }),
      customers,
    )
    expect(result.operation).toBe('作成')
    expect(result.lines).toEqual([
      { field: 'status', label: '状態', before: null, after: '見積' },
      { field: 'title', label: '題名', before: null, after: 'LP制作' },
      { field: 'customer_id', label: '顧客', before: null, after: '山田商店' },
    ])
  })
})

describe('historyCustomerIds', () => {
  it('顧客の変更前・変更後の ID を、重複なく集める', () => {
    expect(
      historyCustomerIds([
        entry({ changes: { customer_id: { before: CUSTOMER_A, after: CUSTOMER_B } } }),
        entry({ operation: 'create', changes: { customer_id: { before: null, after: CUSTOMER_A } } }),
        entry({ changes: { title: { before: 'a', after: 'b' } } }),
      ]),
    ).toEqual([CUSTOMER_A, CUSTOMER_B])
  })
})
