import { describe, expect, it } from 'vitest'
import { groupProjectsByStatus } from './board'
import { PROJECT_STATUSES } from './status'

describe('groupProjectsByStatus', () => {
  it('案件がなくても、7つの列を決まった順で返す', () => {
    const columns = groupProjectsByStatus([])

    expect(columns.map((column) => column.status)).toEqual([...PROJECT_STATUSES])
    expect(columns.every((column) => column.items.length === 0)).toBe(true)
  })

  it('案件を状態ごとの列に分け、列の中では元の順を保つ', () => {
    const columns = groupProjectsByStatus([
      { id: '1', status: 'ordered' },
      { id: '2', status: 'estimate' },
      { id: '3', status: 'ordered' },
      { id: '4', status: 'lost' },
    ] as const)

    const ids = Object.fromEntries(
      columns.map((column) => [column.status, column.items.map((item) => item.id)]),
    )
    expect(ids).toEqual({
      estimate: ['2'],
      ordered: ['1', '3'],
      in_progress: [],
      delivered: [],
      invoiced: [],
      paid: [],
      lost: ['4'],
    })
  })
})
