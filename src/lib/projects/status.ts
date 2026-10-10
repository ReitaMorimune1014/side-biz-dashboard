export const PROJECT_STATUSES = [
  'estimate',
  'ordered',
  'in_progress',
  'delivered',
  'invoiced',
  'paid',
  'lost',
] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const INITIAL_PROJECT_STATUS: ProjectStatus = 'estimate'

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  estimate: '見積',
  ordered: '受注',
  in_progress: '進行',
  delivered: '納品',
  invoiced: '請求済',
  paid: '入金済',
  lost: '失注',
}

// 前に1つ進むか、見積・受注から失注にするだけ。戻すことはできない。
// DB のトリガー(supabase/migrations の check_project_status_transition)と同じ内容にする
const NEXT_STATUSES: Record<ProjectStatus, readonly ProjectStatus[]> = {
  estimate: ['ordered', 'lost'],
  ordered: ['in_progress', 'lost'],
  in_progress: ['delivered'],
  delivered: ['invoiced'],
  invoiced: ['paid'],
  paid: [],
  lost: [],
}

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return typeof value === 'string' && (PROJECT_STATUSES as readonly string[]).includes(value)
}

export function nextStatuses(from: ProjectStatus): readonly ProjectStatus[] {
  return NEXT_STATUSES[from]
}

/** 同じ状態のまま(状態を変えない更新)は許可する */
export function canTransition(from: ProjectStatus, to: ProjectStatus): boolean {
  return from === to || NEXT_STATUSES[from].includes(to)
}
