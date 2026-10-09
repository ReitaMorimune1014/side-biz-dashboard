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

// 状態は、どこからどこへでも変更できる(一覧のプルダウン・編集画面)。
// 下の FORWARD・BACK は、かんばんに出すボタンの選び方で、変更の制限ではない

// 前に1つ進むか、見積・受注から失注にする
const FORWARD: Record<ProjectStatus, readonly ProjectStatus[]> = {
  estimate: ['ordered', 'lost'],
  ordered: ['in_progress', 'lost'],
  in_progress: ['delivered'],
  delivered: ['invoiced'],
  invoiced: ['paid'],
  paid: [],
  lost: [],
}

// 間違えたときに1つ前へ戻す。失注は、元が見積か受注かが残らないため、どちらにも戻す
const BACK: Record<ProjectStatus, readonly ProjectStatus[]> = {
  estimate: [],
  ordered: ['estimate'],
  in_progress: ['ordered'],
  delivered: ['in_progress'],
  invoiced: ['delivered'],
  paid: ['invoiced'],
  lost: ['estimate', 'ordered'],
}

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return typeof value === 'string' && (PROJECT_STATUSES as readonly string[]).includes(value)
}

/** かんばんの「〜にする」ボタン */
export function forwardStatuses(from: ProjectStatus): readonly ProjectStatus[] {
  return FORWARD[from]
}

/** かんばんの「〜に戻す」ボタン */
export function backStatuses(from: ProjectStatus): readonly ProjectStatus[] {
  return BACK[from]
}
