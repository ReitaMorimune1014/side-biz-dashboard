import { toCsv } from '@/lib/csv'
import type { TimeEntry } from './repository'

export const TIME_ENTRY_CSV_HEADER = ['日付', '案件', '顧客', '分', '時間', 'メモ'] as const

type CsvTimeEntry = Pick<TimeEntry, 'project_id' | 'work_date' | 'minutes' | 'memo' | 'project'>

/** 分を、表計算で足しやすい時間の小数にする(小数第2位まで) */
export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100
}

/**
 * 稼働の CSV。customerNames は、案件の ID から顧客名を引く表
 * (稼働の一覧は顧客名を持たないため、案件の一覧から作って渡す)
 */
export function timeEntriesToCsv(
  entries: readonly CsvTimeEntry[],
  customerNames: ReadonlyMap<string, string>,
): string {
  return toCsv(
    TIME_ENTRY_CSV_HEADER,
    entries.map((e) => [
      e.work_date,
      e.project.title,
      customerNames.get(e.project_id) ?? '',
      e.minutes,
      minutesToHours(e.minutes),
      e.memo,
    ]),
  )
}
