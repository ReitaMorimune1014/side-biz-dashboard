import { describe, expect, it } from 'vitest'
import { invoiceStatus } from './status'

const TODAY = '2026-10-10'

describe('invoiceStatus', () => {
  it.each([
    ['2026-10-11', 'unpaid'], // 期限は明日
    ['2026-10-10', 'unpaid'], // 期限は今日(当日はまだ期限切れではない)
    ['2026-10-09', 'overdue'], // 期限は昨日
    ['2025-12-31', 'overdue'], // 年をまたいで過ぎている
  ] as const)('入金日がなく、支払期限が %s なら %s', (due_on, expected) => {
    expect(invoiceStatus({ due_on, paid_on: null }, TODAY)).toBe(expected)
  })

  it.each(['2026-10-11', '2026-10-09'])(
    '入金日があれば、支払期限(%s)に関係なく入金済',
    (due_on) => {
      expect(invoiceStatus({ due_on, paid_on: '2026-10-01' }, TODAY)).toBe('paid')
    },
  )

  it('期限を過ぎてから入金しても、入金済', () => {
    expect(invoiceStatus({ due_on: '2026-09-30', paid_on: '2026-10-05' }, TODAY)).toBe('paid')
  })
})
