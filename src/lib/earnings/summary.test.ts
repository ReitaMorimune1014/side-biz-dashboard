import { describe, expect, it } from 'vitest'
import type { ProjectStatus } from '@/lib/projects/status'
import { hourlyRate, pipeline, summarizeEarnings, type EarningProject } from './summary'

let seq = 0
const project = (
  amount: number,
  earned_on: string | null,
  status: ProjectStatus = earned_on ? 'delivered' : 'in_progress',
): EarningProject => ({ id: `p${++seq}`, title: `案件${seq}`, amount, status, earned_on })

const projects = [
  project(100000, '2026-10-01'),
  project(50000, '2026-10-01'),
  project(30000, '2026-10-31'),
  project(20000, '2026-09-30'), // 前の月
  project(70000, '2025-12-31'), // 前の年
  project(999999, null), // まだ売上にしていない
]

describe('summarizeEarnings', () => {
  it('日ごと: その月の売上を日ごとに数え、月の外は含めない', () => {
    const summary = summarizeEarnings(projects, { view: 'day', year: 2026, month: 10 }, 2026)

    expect(summary.total).toBe(180000)
    expect(summary.count).toBe(3)
    expect(summary.buckets).toHaveLength(31)
    expect(summary.buckets[0]).toMatchObject({ label: '1日', amount: 150000, count: 2 })
    expect(summary.buckets[30]).toMatchObject({ label: '31日', amount: 30000, count: 1 })
    expect(summary.buckets[1]).toMatchObject({ amount: 0, count: 0 })
  })

  it('月ごと: その年の売上を月ごとに数える', () => {
    const summary = summarizeEarnings(projects, { view: 'month', year: 2026 }, 2026)

    expect(summary.total).toBe(200000)
    expect(summary.buckets.find((b) => b.key === '2026-09')).toMatchObject({ amount: 20000 })
    expect(summary.buckets.find((b) => b.key === '2026-10')).toMatchObject({ amount: 180000 })
  })

  it('年ごと: 全期間を年ごとに数える', () => {
    const summary = summarizeEarnings(projects, { view: 'year' }, 2026)

    expect(summary.total).toBe(270000)
    expect(summary.buckets).toEqual([
      { key: '2024', label: '2024年', amount: 0, count: 0 },
      { key: '2025', label: '2025年', amount: 70000, count: 1 },
      { key: '2026', label: '2026年', amount: 200000, count: 4 },
      { key: '2027', label: '2027年', amount: 0, count: 0 },
    ])
  })

  it('期間の案件を、売上日の新しい順に返す', () => {
    const summary = summarizeEarnings(projects, { view: 'month', year: 2026 }, 2026)

    expect(summary.items.map((p) => p.earned_on)).toEqual([
      '2026-10-31',
      '2026-10-01',
      '2026-10-01',
      '2026-09-30',
    ])
  })

  it('売上がなければ、合計 0 で棒はすべて 0', () => {
    const summary = summarizeEarnings([], { view: 'month', year: 2026 }, 2026)

    expect(summary).toMatchObject({ total: 0, count: 0, items: [] })
    expect(summary.buckets.every((b) => b.amount === 0)).toBe(true)
  })
})

describe('hourlyRate', () => {
  it.each([
    [150000, 600, 15000], // 15万円 ÷ 10時間
    [10000, 90, 6667], // 1万円 ÷ 1.5時間(四捨五入)
    [0, 60, 0],
  ])('%i 円 ÷ %i 分 = 時給 %i 円', (yen, minutes, expected) => {
    expect(hourlyRate(yen, minutes)).toBe(expected)
  })

  it('稼働がなければ null', () => {
    expect(hourlyRate(10000, 0)).toBeNull()
  })
})

describe('pipeline', () => {
  it('受注・進行と見積を分けて合計し、失注と売上にした案件は含めない', () => {
    expect(
      pipeline([
        project(100000, null, 'ordered'),
        project(200000, null, 'in_progress'),
        project(50000, null, 'estimate'),
        project(999, null, 'lost'),
        project(888, '2026-10-01', 'delivered'),
        project(777, '2026-10-01', 'paid'),
      ]),
    ).toEqual({
      committed: { amount: 300000, count: 2 },
      estimate: { amount: 50000, count: 1 },
    })
  })
})
