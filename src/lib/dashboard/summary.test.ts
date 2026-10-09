import { describe, expect, it } from 'vitest'
import type { ProjectStatus } from '@/lib/projects/status'
import { statusCounts, upcomingDeadlines } from './summary'

const TODAY = '2026-10-10'

function project(id: string, status: ProjectStatus, due_date: string | null) {
  return { id, status, due_date }
}

describe('upcomingDeadlines', () => {
  it('期限切れと、今日から14日以内の納期を、近い順に返す', () => {
    const projects = [
      project('later', 'in_progress', '2026-10-24'),
      project('today', 'ordered', '2026-10-10'),
      project('overdue', 'in_progress', '2026-10-01'),
      project('tomorrow', 'ordered', '2026-10-11'),
    ]

    expect(upcomingDeadlines(projects, TODAY).map((p) => [p.id, p.daysLeft])).toEqual([
      ['overdue', -9],
      ['today', 0],
      ['tomorrow', 1],
      ['later', 14],
    ])
  })

  it('15日以上先の納期は含めない', () => {
    expect(upcomingDeadlines([project('far', 'ordered', '2026-10-25')], TODAY)).toEqual([])
  })

  it.each<ProjectStatus>(['estimate', 'delivered', 'invoiced', 'paid', 'lost'])(
    '受注・進行以外(%s)は含めない',
    (status) => {
      expect(upcomingDeadlines([project('p', status, '2026-10-01')], TODAY)).toEqual([])
    },
  )

  it('納期が未定の案件は含めない', () => {
    expect(upcomingDeadlines([project('p', 'in_progress', null)], TODAY)).toEqual([])
  })

  it('月や年をまたいでも日数を数える', () => {
    const [deadline] = upcomingDeadlines([project('p', 'ordered', '2027-01-03')], '2026-12-28')
    expect(deadline.daysLeft).toBe(6)
  })

  it('日数を変えられる', () => {
    const projects = [project('a', 'ordered', '2026-10-17'), project('b', 'ordered', '2026-10-18')]
    expect(upcomingDeadlines(projects, TODAY, 7).map((p) => p.id)).toEqual(['a'])
  })

  it('元の案件の項目を残す', () => {
    const [deadline] = upcomingDeadlines([{ ...project('p', 'ordered', TODAY), title: '題名' }], TODAY)
    expect(deadline.title).toBe('題名')
  })
})

describe('statusCounts', () => {
  it('7つの状態すべてを状態の順に数える(0件の状態も返す)', () => {
    const projects = [
      project('1', 'in_progress', null),
      project('2', 'estimate', null),
      project('3', 'in_progress', null),
      project('4', 'lost', null),
    ]

    expect(statusCounts(projects)).toEqual([
      { status: 'estimate', count: 1 },
      { status: 'ordered', count: 0 },
      { status: 'in_progress', count: 2 },
      { status: 'delivered', count: 0 },
      { status: 'invoiced', count: 0 },
      { status: 'paid', count: 0 },
      { status: 'lost', count: 1 },
    ])
  })

  it('案件がなければ、すべて0件', () => {
    expect(statusCounts([]).every((c) => c.count === 0)).toBe(true)
  })
})
