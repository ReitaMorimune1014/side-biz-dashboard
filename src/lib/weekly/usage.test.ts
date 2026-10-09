import { describe, expect, it } from 'vitest'
import { weeklyUsage } from './usage'

describe('weeklyUsage(目標 5時間 = 300分)', () => {
  it.each([
    [0, 'ok'],
    [239, 'ok'],
    [240, 'warning'], // ちょうど 80%
    [300, 'warning'], // ちょうど目標
    [301, 'over'],
  ] as const)('%i 分は %s', (total, level) => {
    expect(weeklyUsage(total, 300).level).toBe(level)
  })

  it('消化率は切り捨て、残りと超過を分で返す', () => {
    expect(weeklyUsage(179, 300)).toEqual({
      totalMinutes: 179,
      targetMinutes: 300,
      percent: 59,
      remainingMinutes: 121,
      overMinutes: 0,
      level: 'ok',
    })
  })

  it('目標を超えたら、消化率は 100% を超え、残りは 0', () => {
    expect(weeklyUsage(390, 300)).toMatchObject({
      percent: 130,
      remainingMinutes: 0,
      overMinutes: 90,
      level: 'over',
    })
  })
})

describe('weeklyUsage(端の値)', () => {
  it('目標 1分で 1分記録したら、ちょうど目標なので注意', () => {
    expect(weeklyUsage(1, 1)).toMatchObject({ percent: 100, level: 'warning' })
  })

  it('目標の 80% が端数でも、それ以上なら注意', () => {
    // 目標 7分の 80% は 5.6分。5分は余裕、6分は注意
    expect(weeklyUsage(5, 7).level).toBe('ok')
    expect(weeklyUsage(6, 7).level).toBe('warning')
  })
})
