/** 目標のこの割合から「注意」にする */
export const WARNING_RATIO = 0.8

export type UsageLevel = 'ok' | 'warning' | 'over'

export type WeeklyUsage = {
  totalMinutes: number
  targetMinutes: number
  /** 消化率(%、切り捨て)。100 を超えることもある */
  percent: number
  /** 目標までの残り。超えていたら 0 */
  remainingMinutes: number
  /** 目標を超えた分。超えていなければ 0 */
  overMinutes: number
  /** 目標ちょうどは「注意」、超えたら「超過」 */
  level: UsageLevel
}

export function weeklyUsage(totalMinutes: number, targetMinutes: number): WeeklyUsage {
  const level: UsageLevel =
    totalMinutes > targetMinutes
      ? 'over'
      : totalMinutes >= targetMinutes * WARNING_RATIO
        ? 'warning'
        : 'ok'
  return {
    totalMinutes,
    targetMinutes,
    percent: Math.floor((totalMinutes * 100) / targetMinutes),
    remainingMinutes: Math.max(targetMinutes - totalMinutes, 0),
    overMinutes: Math.max(totalMinutes - targetMinutes, 0),
    level,
  }
}
