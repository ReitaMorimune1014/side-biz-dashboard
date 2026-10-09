import { PROJECT_STATUSES, type ProjectStatus } from '@/lib/projects/status'

/** 納期を見る案件の状態。約束した仕事(受注・進行)だけ */
export const DEADLINE_STATUSES: readonly ProjectStatus[] = ['ordered', 'in_progress']

/** 「期限が近い」とする日数(今日から何日後の納期までか) */
export const DEADLINE_WINDOW_DAYS = 14

type DeadlineProject = { status: ProjectStatus; due_date: string | null }

export type Deadline<P> = P & {
  due_date: string
  /** 納期までの日数。0 は今日、負の数は期限切れ */
  daysLeft: number
}

function dayNumber(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return Date.UTC(year, month - 1, day) / 86_400_000
}

/**
 * 受注・進行の案件のうち、期限切れと、今日から days 日以内に納期がある案件。
 * 納期の近い順(同じ日なら元の並び)
 */
export function upcomingDeadlines<P extends DeadlineProject>(
  projects: readonly P[],
  today: string,
  days: number = DEADLINE_WINDOW_DAYS,
): Deadline<P>[] {
  const base = dayNumber(today)
  return projects
    .filter((p): p is P & { due_date: string } => p.due_date !== null && DEADLINE_STATUSES.includes(p.status))
    .map((p) => ({ ...p, daysLeft: dayNumber(p.due_date) - base }))
    .filter((p) => p.daysLeft <= days)
    .sort((a, b) => a.daysLeft - b.daysLeft)
}

export type StatusCount = { status: ProjectStatus; count: number }

/** 状態ごとの案件数。件数が 0 の状態も、状態の順に全て返す */
export function statusCounts(projects: readonly { status: ProjectStatus }[]): StatusCount[] {
  return PROJECT_STATUSES.map((status) => ({
    status,
    count: projects.filter((p) => p.status === status).length,
  }))
}
