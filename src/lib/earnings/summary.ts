import type { ProjectStatus } from '@/lib/projects/status'
import { bucketKeyOf, bucketSlots, periodRange, type Period } from './period'

/** 集計に使う案件の項目 */
export type EarningProject = {
  id: string
  title: string
  amount: number
  status: ProjectStatus
  earned_on: string | null
}

export type Bucket = { key: string; label: string; amount: number; count: number }

export type EarningsSummary<P extends EarningProject> = {
  total: number
  count: number
  buckets: Bucket[]
  /** 期間に売上として数えた案件(売上日の新しい順) */
  items: (P & { earned_on: string })[]
}

function isEarned<P extends EarningProject>(project: P): project is P & { earned_on: string } {
  return project.earned_on !== null
}

/** 期間の売上を、棒グラフの棒ごとに数える */
export function summarizeEarnings<P extends EarningProject>(
  projects: readonly P[],
  period: Period,
  thisYear: number,
): EarningsSummary<P> {
  const range = periodRange(period)
  const earned = projects.filter(isEarned)
  const items = earned
    .filter((p) => !range || (p.earned_on >= range.start && p.earned_on <= range.end))
    .sort((a, b) => b.earned_on.localeCompare(a.earned_on))

  const slots = bucketSlots(
    period,
    earned.map((p) => Number(p.earned_on.slice(0, 4))),
    thisYear,
  )
  const byKey = new Map(slots.map((slot) => [slot.key, { ...slot, amount: 0, count: 0 }]))
  for (const project of items) {
    const bucket = byKey.get(bucketKeyOf(period, project.earned_on))
    if (bucket) {
      bucket.amount += project.amount
      bucket.count += 1
    }
  }

  return {
    total: items.reduce((sum, p) => sum + p.amount, 0),
    count: items.length,
    buckets: [...byKey.values()],
    items,
  }
}

/** 時給(円、四捨五入)。稼働がなければ null */
export function hourlyRate(totalYen: number, minutes: number): number | null {
  if (minutes <= 0) return null
  return Math.round((totalYen * 60) / minutes)
}

export type Pipeline = {
  /** 受注・進行(まだ売上にしていない、決まった仕事) */
  committed: { amount: number; count: number }
  /** 見積(決まるかどうか分からない) */
  estimate: { amount: number; count: number }
}

/** これから売上になる見込み。失注と、売上にした案件は含めない */
export function pipeline(projects: readonly EarningProject[]): Pipeline {
  const sum = (statuses: readonly ProjectStatus[]) => {
    const matched = projects.filter((p) => statuses.includes(p.status))
    return { amount: matched.reduce((s, p) => s + p.amount, 0), count: matched.length }
  }
  return { committed: sum(['ordered', 'in_progress']), estimate: sum(['estimate']) }
}
