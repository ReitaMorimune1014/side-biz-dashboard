import { describe, expect, it } from 'vitest'
import { earnedOnPatch } from './earned'
import type { ProjectStatus } from './status'

const TODAY = '2026-10-10'

describe('earnedOnPatch(かんばん・一覧のプルダウン)', () => {
  it.each<[ProjectStatus, ProjectStatus]>([
    ['in_progress', 'delivered'],
    ['ordered', 'invoiced'],
    ['estimate', 'paid'],
    ['lost', 'delivered'],
  ])('%s → %s は、売上日を今日にする', (from, to) => {
    expect(earnedOnPatch({ from, to }, TODAY)).toEqual({ earned_on: TODAY })
  })

  it.each<[ProjectStatus, ProjectStatus]>([
    ['delivered', 'invoiced'],
    ['invoiced', 'paid'],
    ['paid', 'delivered'],
    ['delivered', 'delivered'],
  ])('%s → %s は、売上日を変えない', (from, to) => {
    expect(earnedOnPatch({ from, to }, TODAY)).toEqual({})
  })

  it.each<[ProjectStatus, ProjectStatus]>([
    ['delivered', 'in_progress'],
    ['paid', 'lost'],
    ['in_progress', 'ordered'],
  ])('%s → %s は、売上日を消す', (from, to) => {
    expect(earnedOnPatch({ from, to }, TODAY)).toEqual({ earned_on: null })
  })
})

describe('earnedOnPatch(編集画面で売上日を指定した)', () => {
  it('納品以降なら、指定した日にする', () => {
    expect(earnedOnPatch({ from: 'delivered', to: 'paid' }, TODAY, '2026-09-30')).toEqual({
      earned_on: '2026-09-30',
    })
    expect(earnedOnPatch({ from: 'in_progress', to: 'delivered' }, TODAY, '2026-09-30')).toEqual({
      earned_on: '2026-09-30',
    })
  })

  it('納品より前なら、指定しても消す', () => {
    expect(earnedOnPatch({ from: 'delivered', to: 'in_progress' }, TODAY, '2026-09-30')).toEqual({
      earned_on: null,
    })
  })
})
