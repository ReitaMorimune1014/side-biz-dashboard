import { describe, expect, it } from 'vitest'
import {
  bucketKeyOf,
  bucketSlots,
  parsePeriod,
  periodLabel,
  periodParam,
  periodRange,
  shiftPeriod,
  switchView,
} from './period'

const TODAY = '2026-10-10'

describe('parsePeriod', () => {
  it('指定がなければ、今年の月ごと', () => {
    expect(parsePeriod({}, TODAY)).toEqual({ view: 'month', year: 2026 })
  })

  it.each([
    [{ view: 'day', at: '2026-02' }, { view: 'day', year: 2026, month: 2 }],
    [{ view: 'day' }, { view: 'day', year: 2026, month: 10 }],
    [{ view: 'day', at: '2026-13' }, { view: 'day', year: 2026, month: 10 }],
    [{ view: 'day', at: '26-02' }, { view: 'day', year: 2026, month: 10 }],
    [{ view: 'month', at: '2025' }, { view: 'month', year: 2025 }],
    [{ view: 'month', at: '1999' }, { view: 'month', year: 2026 }],
    [{ view: 'month', at: 'abc' }, { view: 'month', year: 2026 }],
    [{ view: 'year', at: '2025' }, { view: 'year' }],
    [{ view: 'week' }, { view: 'month', year: 2026 }],
  ])('%j は %j', (params, expected) => {
    expect(parsePeriod(params, TODAY)).toEqual(expected)
  })
})

describe('periodRange', () => {
  it.each([
    [{ view: 'day', year: 2026, month: 10 } as const, '2026-10-01', '2026-10-31'],
    [{ view: 'day', year: 2026, month: 2 } as const, '2026-02-01', '2026-02-28'],
    [{ view: 'day', year: 2024, month: 2 } as const, '2024-02-01', '2024-02-29'],
    [{ view: 'month', year: 2026 } as const, '2026-01-01', '2026-12-31'],
  ])('%j は %s〜%s', (period, start, end) => {
    expect(periodRange(period)).toEqual({ start, end })
  })

  it('全期間は範囲なし', () => {
    expect(periodRange({ view: 'year' })).toBeNull()
  })
})

describe('shiftPeriod', () => {
  it('日ごとは、年をまたいで前後の月に移る', () => {
    expect(shiftPeriod({ view: 'day', year: 2026, month: 1 }, -1)).toEqual({
      view: 'day',
      year: 2025,
      month: 12,
    })
    expect(shiftPeriod({ view: 'day', year: 2026, month: 12 }, 1)).toEqual({
      view: 'day',
      year: 2027,
      month: 1,
    })
  })

  it('月ごとは、前後の年に移る', () => {
    expect(shiftPeriod({ view: 'month', year: 2026 }, -1)).toEqual({ view: 'month', year: 2025 })
  })

  it('全期間と、範囲の外には移れない', () => {
    expect(shiftPeriod({ view: 'year' }, 1)).toBeNull()
    expect(shiftPeriod({ view: 'month', year: 2000 }, -1)).toBeNull()
  })
})

describe('periodLabel と periodParam', () => {
  it.each([
    [{ view: 'day', year: 2026, month: 2 } as const, '2026年2月', '2026-02'],
    [{ view: 'month', year: 2026 } as const, '2026年', '2026'],
    [{ view: 'year' } as const, '全期間', null],
  ])('%j', (period, label, param) => {
    expect(periodLabel(period)).toBe(label)
    expect(periodParam(period)).toBe(param)
  })
})

describe('bucketSlots', () => {
  it('日ごとは、その月の日数だけ並べる', () => {
    const slots = bucketSlots({ view: 'day', year: 2024, month: 2 }, [], 2026)
    expect(slots).toHaveLength(29)
    expect(slots[0]).toEqual({ key: '2024-02-01', label: '1日' })
    expect(slots[28]).toEqual({ key: '2024-02-29', label: '29日' })
  })

  it('月ごとは、12か月を並べる', () => {
    const slots = bucketSlots({ view: 'month', year: 2026 }, [], 2026)
    expect(slots.map((s) => s.key)).toEqual([
      '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
      '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12',
    ])
  })

  it('年ごとは、売上のある最初の年から今年まで(途中の空いた年も並べる)', () => {
    expect(bucketSlots({ view: 'year' }, [2023, 2025], 2026).map((s) => s.label)).toEqual([
      '2023年',
      '2024年',
      '2025年',
      '2026年',
    ])
  })

  it('年ごとで売上がなければ、今年だけ', () => {
    expect(bucketSlots({ view: 'year' }, [], 2026).map((s) => s.key)).toEqual(['2026'])
  })
})

describe('switchView', () => {
  it.each([
    [{ view: 'day', year: 2025, month: 3 } as const, 'month', { view: 'month', year: 2025 }],
    [{ view: 'month', year: 2026 } as const, 'day', { view: 'day', year: 2026, month: 10 }],
    [{ view: 'month', year: 2025 } as const, 'day', { view: 'day', year: 2025, month: 1 }],
    [{ view: 'year' } as const, 'month', { view: 'month', year: 2026 }],
    [{ view: 'day', year: 2025, month: 3 } as const, 'year', { view: 'year' }],
  ] as const)('%j から %s へ切り替えると %j', (current, view, expected) => {
    expect(switchView(view, current, TODAY)).toEqual(expected)
  })
})

describe('bucketKeyOf', () => {
  it.each([
    [{ view: 'day', year: 2026, month: 10 } as const, '2026-10-09'],
    [{ view: 'month', year: 2026 } as const, '2026-10'],
    [{ view: 'year' } as const, '2026'],
  ])('%j では %s', (period, key) => {
    expect(bucketKeyOf(period, '2026-10-09')).toBe(key)
  })
})
