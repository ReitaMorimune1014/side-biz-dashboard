import { describe, expect, it } from 'vitest'
import {
  PROJECT_STATUSES,
  backStatuses,
  canTransition,
  forwardStatuses,
  isProjectStatus,
  type ProjectStatus,
} from './status'

// 許可する遷移を、全てここに列挙する。ここにない組み合わせは、すべて拒否されるべき
const ALLOWED: ReadonlyArray<[ProjectStatus, ProjectStatus]> = [
  // 進む
  ['estimate', 'ordered'],
  ['estimate', 'lost'],
  ['ordered', 'in_progress'],
  ['ordered', 'lost'],
  ['in_progress', 'delivered'],
  ['delivered', 'invoiced'],
  ['invoiced', 'paid'],
  // 1つ前に戻す
  ['ordered', 'estimate'],
  ['in_progress', 'ordered'],
  ['delivered', 'in_progress'],
  ['invoiced', 'delivered'],
  ['paid', 'invoiced'],
  ['lost', 'estimate'],
  ['lost', 'ordered'],
]

const isAllowed = (from: ProjectStatus, to: ProjectStatus) =>
  ALLOWED.some(([f, t]) => f === from && t === to)

const allPairs = PROJECT_STATUSES.flatMap((from) =>
  PROJECT_STATUSES.map((to) => [from, to] as const),
)

describe('canTransition', () => {
  it.each(allPairs.filter(([from, to]) => from !== to && isAllowed(from, to)))(
    '%s → %s は許可する',
    (from, to) => {
      expect(canTransition(from, to)).toBe(true)
    },
  )

  it.each(allPairs.filter(([from, to]) => from !== to && !isAllowed(from, to)))(
    '%s → %s は拒否する',
    (from, to) => {
      expect(canTransition(from, to)).toBe(false)
    },
  )

  it.each(PROJECT_STATUSES)('%s のまま(状態を変えない)は許可する', (status) => {
    expect(canTransition(status, status)).toBe(true)
  })
})

describe('業務ルール', () => {
  it('失注にできるのは、見積と受注からだけ', () => {
    const from = PROJECT_STATUSES.filter((status) => status !== 'lost' && canTransition(status, 'lost'))
    expect(from).toEqual(['estimate', 'ordered'])
  })

  it('入金済と失注からは、前に進めない', () => {
    expect(forwardStatuses('paid')).toEqual([])
    expect(forwardStatuses('lost')).toEqual([])
  })

  it('見積より前には戻せない', () => {
    expect(backStatuses('estimate')).toEqual([])
  })

  it('2つ以上前には、一度に戻せない', () => {
    expect(canTransition('in_progress', 'estimate')).toBe(false)
    expect(canTransition('paid', 'delivered')).toBe(false)
  })

  it('失注からは、見積と受注にだけ戻せる', () => {
    expect(backStatuses('lost')).toEqual(['estimate', 'ordered'])
  })
})

describe('isProjectStatus', () => {
  it.each(PROJECT_STATUSES)('%s は状態', (status) => {
    expect(isProjectStatus(status)).toBe(true)
  })

  it.each(['', 'ESTIMATE', '見積', 'cancelled', null, 1])('%s は状態ではない', (value) => {
    expect(isProjectStatus(value)).toBe(false)
  })
})
