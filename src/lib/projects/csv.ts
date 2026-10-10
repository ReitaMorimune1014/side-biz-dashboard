import { toCsv } from '@/lib/csv'
import type { Project } from './repository'
import { PROJECT_STATUS_LABELS } from './status'

export const PROJECT_CSV_HEADER = ['顧客', '題名', '金額', '状態', '納期', '売上日', 'メモ'] as const

type CsvProject = Pick<Project, 'title' | 'amount' | 'status' | 'due_date' | 'earned_on' | 'memo' | 'customer'>

/** 案件の CSV。金額は税込の円(整数)、日付は YYYY-MM-DD */
export function projectsToCsv(projects: readonly CsvProject[]): string {
  return toCsv(
    PROJECT_CSV_HEADER,
    projects.map((p) => [
      p.customer.deleted ? `${p.customer.name}(削除済み)` : p.customer.name,
      p.title,
      p.amount,
      PROJECT_STATUS_LABELS[p.status],
      p.due_date,
      p.earned_on,
      p.memo,
    ]),
  )
}
