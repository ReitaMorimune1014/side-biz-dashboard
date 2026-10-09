import { describe, expect, it } from 'vitest'
import { weeklyUsage } from './usage'

describe('weeklyUsage(目標 5時間 = 300分)', () => {
  it.each([
    [0, 'in_progress'],
    [299, 'in_progress'],
    [300, 'achieved'], // ちょうど目標
    [301, 'achieved'], // 超えても達成のまま
  ] as const)('%i 分は %s', (total, level) => {
    expect(weeklyUsage(total, 300).level).toBe(level)
  })

  it('消化率は切り捨て、残りを分で返す', () => {
    expect(weeklyUsage(179, 300)).toEqual({
      totalMinutes: 179,
      targetMinutes: 300,
      percent: 59,
      remainingMinutes: 121,
      extraMinutes: 0,
      level: 'in_progress',
    })
  })

  it('目標を超えたら、消化率は 100% を超え、多く稼働した分を返す', () => {
    expect(weeklyUsage(390, 300)).toMatchObject({
      percent: 130,
      remainingMinutes: 0,
      extraMinutes: 90,
      level: 'achieved',
    })
  })

  it('目標 1分で 1分記録したら、ちょうど達成', () => {
    expect(weeklyUsage(1, 1)).toMatchObject({ percent: 100, level: 'achieved' })
  })
})
