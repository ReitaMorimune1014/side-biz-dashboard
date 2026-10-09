import { describe, expect, it } from 'vitest'
import type { ProjectStatus } from '@/lib/projects/status'
import { projectStatusFromInvoices } from './project-status'

const PAID = { paid_on: '2026-10-10' }
const UNPAID = { paid_on: null }

describe('projectStatusFromInvoices(納品・請求済・入金済の案件)', () => {
  it.each<ProjectStatus>(['delivered', 'invoiced', 'paid'])('%s の案件', (current) => {
    expect(projectStatusFromInvoices(current, [UNPAID])).toBe('invoiced')
    expect(projectStatusFromInvoices(current, [PAID, UNPAID])).toBe('invoiced')
    expect(projectStatusFromInvoices(current, [PAID])).toBe('paid')
    expect(projectStatusFromInvoices(current, [PAID, PAID])).toBe('paid')
    expect(projectStatusFromInvoices(current, [])).toBe('delivered')
  })
})

describe('projectStatusFromInvoices(連動しない案件)', () => {
  it.each<ProjectStatus>(['estimate', 'ordered', 'in_progress'])(
    '納品前(%s)は、着手金などの請求があっても変えない',
    (current) => {
      expect(projectStatusFromInvoices(current, [UNPAID])).toBe(current)
      expect(projectStatusFromInvoices(current, [PAID])).toBe(current)
      expect(projectStatusFromInvoices(current, [])).toBe(current)
    },
  )

  it('失注は変えない', () => {
    expect(projectStatusFromInvoices('lost', [UNPAID])).toBe('lost')
    expect(projectStatusFromInvoices('lost', [PAID])).toBe('lost')
  })
})
