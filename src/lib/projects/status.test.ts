import { describe, expect, it } from 'vitest'
import {
  PROJECT_STATUSES,
  canTransition,
  isProjectStatus,
  nextStatuses,
  type ProjectStatus,
} from './status'

// 許可する遷移を、全てここに列挙する。ここにない組み合わせは、すべて拒否されるべき
const ALLOWED: ReadonlyArray<[ProjectStatus, ProjectStatus]> = [
  ['estimate', 'ordered'],
  ['estimate', 'lost'],
  ['ordered', 'in_progress'],
  ['ordered', 'lost'],
  ['in_progress', 'delivered'],
  ['delivered', 'invoiced'],
  ['invoiced', 'paid'],
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

  it('入金済と失注からは、どこにも進めない', () => {
    expect(nextStatuses('paid')).toEqual([])
    expect(nextStatuses('lost')).toEqual([])
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
