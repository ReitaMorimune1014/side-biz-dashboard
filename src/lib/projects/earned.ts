import type { StatusChange } from './schema'
import type { ProjectStatus } from './status'

/** この状態の案件は、売上日に案件の金額を売上として数える(DB の check 制約と同じ) */
export const EARNED_STATUSES: readonly ProjectStatus[] = ['delivered', 'invoiced', 'paid']

export function isEarnedStatus(status: ProjectStatus): boolean {
  return EARNED_STATUSES.includes(status)
}

/**
 * 状態を変えるときに、売上日をどうするか。返した値を update にそのまま混ぜる。
 * - 納品より前にする → 売上日を消す
 * - 売上日を指定した(編集画面) → その日
 * - 納品以降の中で変える(納品→請求済など) → 変えない(項目を送らない)
 * - 納品より前から納品以降に進める → 今日
 */
export function earnedOnPatch(
  change: StatusChange,
  today: string,
  requested: string | null = null,
): { earned_on?: string | null } {
  if (!isEarnedStatus(change.to)) return { earned_on: null }
  if (requested) return { earned_on: requested }
  if (isEarnedStatus(change.from)) return {}
  return { earned_on: today }
}
