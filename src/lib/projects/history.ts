import { formatYen } from '@/lib/money'
import { isProjectStatus, PROJECT_STATUS_LABELS } from './status'

/** 履歴に記録する項目。表示もこの順に並べる */
export const HISTORY_FIELDS = [
  'status',
  'title',
  'customer_id',
  'amount',
  'due_date',
  'earned_on',
  'memo',
] as const
export type HistoryField = (typeof HISTORY_FIELDS)[number]

export const HISTORY_FIELD_LABELS: Record<HistoryField, string> = {
  status: '状態',
  title: '題名',
  customer_id: '顧客',
  amount: '金額',
  due_date: '納期',
  earned_on: '売上日',
  memo: 'メモ',
}

export type HistoryOperation = 'create' | 'update'

export const HISTORY_OPERATION_LABELS: Record<HistoryOperation, string> = {
  create: '作成',
  update: '変更',
}

export type HistoryChange = { before: unknown; after: unknown }

export type ProjectHistoryEntry = {
  id: number
  operation: HistoryOperation
  /** ISO 8601 */
  changedAt: string
  changes: Partial<Record<HistoryField, HistoryChange>>
}

export type CustomerNames = ReadonlyMap<string, { name: string; deleted: boolean }>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isHistoryOperation(value: unknown): value is HistoryOperation {
  return value === 'create' || value === 'update'
}

/**
 * DB の changes(jsonb)を読む。形の合わない値と、知らない項目は無視する
 * (あとで項目を増減しても、古い履歴の表示が壊れないように)
 */
export function parseHistoryChanges(value: unknown): ProjectHistoryEntry['changes'] {
  if (!isRecord(value)) return {}
  const changes: ProjectHistoryEntry['changes'] = {}
  for (const field of HISTORY_FIELDS) {
    const change = value[field]
    if (isRecord(change)) changes[field] = { before: change.before ?? null, after: change.after ?? null }
  }
  return changes
}

/** 1つの値を、画面に出す文字列にする */
export function formatHistoryValue(field: HistoryField, value: unknown, customers: CustomerNames): string {
  if (value === null || value === undefined || value === '') {
    return field === 'due_date' ? '未定' : 'なし'
  }
  switch (field) {
    case 'status':
      return isProjectStatus(value) ? PROJECT_STATUS_LABELS[value] : String(value)
    case 'amount':
      return typeof value === 'number' && Number.isInteger(value) ? formatYen(value) : String(value)
    case 'due_date':
    case 'earned_on':
      return String(value).replaceAll('-', '/')
    case 'customer_id': {
      const customer = typeof value === 'string' ? customers.get(value) : undefined
      if (!customer) return '(不明な顧客)'
      return customer.deleted ? `${customer.name}(削除済み)` : customer.name
    }
    case 'title':
    case 'memo':
      return String(value)
  }
}

export type HistoryLine = {
  field: HistoryField
  label: string
  /** 作成のときは null(変更前がない) */
  before: string | null
  after: string
}

/** 履歴の1件を、画面に出す行にする。項目は HISTORY_FIELDS の順 */
export function describeHistory(
  entry: ProjectHistoryEntry,
  customers: CustomerNames,
): { operation: string; lines: HistoryLine[] } {
  const lines = HISTORY_FIELDS.flatMap((field): HistoryLine[] => {
    const change = entry.changes[field]
    if (!change) return []
    return [
      {
        field,
        label: HISTORY_FIELD_LABELS[field],
        before: entry.operation === 'create' ? null : formatHistoryValue(field, change.before, customers),
        after: formatHistoryValue(field, change.after, customers),
      },
    ]
  })
  return { operation: HISTORY_OPERATION_LABELS[entry.operation], lines }
}

/** 履歴に出てくる顧客の ID(名前を引くため) */
export function historyCustomerIds(entries: readonly ProjectHistoryEntry[]): string[] {
  const ids = new Set<string>()
  for (const entry of entries) {
    const change = entry.changes.customer_id
    for (const value of [change?.before, change?.after]) {
      if (typeof value === 'string') ids.add(value)
    }
  }
  return [...ids]
}
