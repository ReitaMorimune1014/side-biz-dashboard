/** 週の時間は「達成したい目標」。届いたら達成で、超えても達成のまま */
export type UsageLevel = 'in_progress' | 'achieved'

export type WeeklyUsage = {
  totalMinutes: number
  targetMinutes: number
  /** 消化率(%、切り捨て)。100 を超えることもある */
  percent: number
  /** 目標までの残り。届いていたら 0 */
  remainingMinutes: number
  /** 目標より多く稼働した分。届いていなければ 0 */
  extraMinutes: number
  level: UsageLevel
}

export function weeklyUsage(totalMinutes: number, targetMinutes: number): WeeklyUsage {
  return {
    totalMinutes,
    targetMinutes,
    percent: Math.floor((totalMinutes * 100) / targetMinutes),
    remainingMinutes: Math.max(targetMinutes - totalMinutes, 0),
    extraMinutes: Math.max(totalMinutes - targetMinutes, 0),
    level: totalMinutes >= targetMinutes ? 'achieved' : 'in_progress',
  }
}
