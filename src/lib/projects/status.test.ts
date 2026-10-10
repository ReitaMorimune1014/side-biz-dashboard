import { describe, expect, it } from 'vitest'
import { PROJECT_STATUSES, backStatuses, forwardStatuses, isProjectStatus } from './status'

describe('かんばんのボタン', () => {
  it.each([
    ['estimate', ['ordered', 'lost'], []],
    ['ordered', ['in_progress', 'lost'], ['estimate']],
    ['in_progress', ['delivered'], ['ordered']],
    ['delivered', ['invoiced'], ['in_progress']],
    ['invoiced', ['paid'], ['delivered']],
    ['paid', [], ['invoiced']],
    ['lost', [], ['estimate', 'ordered']],
  ] as const)('%s: 進む先は %j、戻す先は %j', (from, forward, back) => {
    expect(forwardStatuses(from)).toEqual(forward)
    expect(backStatuses(from)).toEqual(back)
  })

  it.each(PROJECT_STATUSES)('%s のボタンに、今の状態は含まれない', (status) => {
    expect([...forwardStatuses(status), ...backStatuses(status)]).not.toContain(status)
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
