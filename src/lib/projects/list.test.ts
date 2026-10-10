import { describe, expect, it } from 'vitest'
import type { ProjectStatus } from './status'
import {
  applyProjectListQuery,
  filterProjectList,
  hasProjectFilters,
  parseProjectListQuery,
  projectListParams,
  type ProjectListQuery,
} from './list'

function project(
  id: string,
  overrides: Partial<{
    title: string
    memo: string | null
    amount: number
    due_date: string | null
    status: ProjectStatus
    customer: string
  }> = {},
) {
  return {
    id,
    title: overrides.title ?? `案件${id}`,
    memo: overrides.memo ?? null,
    amount: overrides.amount ?? 10000,
    due_date: overrides.due_date ?? null,
    status: overrides.status ?? 'estimate',
    customer: { name: overrides.customer ?? '山田商店' },
  }
}

const DEFAULT: ProjectListQuery = { q: '', status: null, sort: 'created', page: 1 }

const ids = (page: { items: { id: string }[] }) => page.items.map((p) => p.id)

describe('parseProjectListQuery', () => {
  it('何もなければ既定値', () => {
    expect(parseProjectListQuery({})).toEqual(DEFAULT)
  })

  it('URL の値を読む', () => {
    expect(
      parseProjectListQuery({ q: ' ロゴ ', status: 'in_progress', sort: 'due', page: '2' }),
    ).toEqual({ q: 'ロゴ', status: 'in_progress', sort: 'due', page: 2 })
  })

  it('不正な値は既定値に戻す', () => {
    expect(parseProjectListQuery({ status: 'unknown', sort: 'title', page: 'x' })).toEqual(DEFAULT)
  })
})

describe('projectListParams', () => {
  it('既定値は URL に入れない', () => {
    expect(projectListParams(DEFAULT)).toEqual({ q: '', status: null, sort: null, page: null })
  })

  it('ページだけ差し替えられる', () => {
    expect(projectListParams({ ...DEFAULT, sort: 'amount', page: 3 }, 1)).toEqual({
      q: '',
      status: null,
      sort: 'amount',
      page: null,
    })
  })
})

describe('hasProjectFilters', () => {
  it('検索語か状態があれば true(並び替えとページは条件に含めない)', () => {
    expect(hasProjectFilters(DEFAULT)).toBe(false)
    expect(hasProjectFilters({ ...DEFAULT, sort: 'due', page: 2 })).toBe(false)
    expect(hasProjectFilters({ ...DEFAULT, q: 'ロゴ' })).toBe(true)
    expect(hasProjectFilters({ ...DEFAULT, status: 'lost' })).toBe(true)
  })
})

describe('applyProjectListQuery', () => {
  it('題名・顧客名・メモで検索する', () => {
    const projects = [
      project('1', { title: 'ロゴ制作' }),
      project('2', { customer: 'ロゴス株式会社' }),
      project('3', { memo: 'ロゴの修正あり' }),
      project('4', { title: 'LP制作' }),
    ]
    expect(ids(applyProjectListQuery(projects, { ...DEFAULT, q: 'ロゴ' }))).toEqual(['1', '2', '3'])
  })

  it('状態で絞り込む', () => {
    const projects = [
      project('1', { status: 'in_progress' }),
      project('2', { status: 'estimate' }),
      project('3', { status: 'in_progress' }),
    ]
    expect(ids(applyProjectListQuery(projects, { ...DEFAULT, status: 'in_progress' }))).toEqual([
      '1',
      '3',
    ])
  })

  it('検索と絞り込みは両方を満たすものだけ', () => {
    const projects = [
      project('1', { title: 'ロゴ', status: 'in_progress' }),
      project('2', { title: 'ロゴ', status: 'estimate' }),
      project('3', { title: 'LP', status: 'in_progress' }),
    ]
    expect(
      ids(applyProjectListQuery(projects, { ...DEFAULT, q: 'ロゴ', status: 'in_progress' })),
    ).toEqual(['1'])
  })

  it('登録の新しい順は、渡された順のまま', () => {
    const projects = [project('new'), project('mid'), project('old')]
    expect(ids(applyProjectListQuery(projects, DEFAULT))).toEqual(['new', 'mid', 'old'])
  })

  it('納期の近い順。未定は最後、同じ納期は登録の新しい順', () => {
    const projects = [
      project('none', { due_date: null }),
      project('late', { due_date: '2026-12-01' }),
      project('soon-new', { due_date: '2026-10-20' }),
      project('soon-old', { due_date: '2026-10-20' }),
      project('none2', { due_date: null }),
    ]
    expect(ids(applyProjectListQuery(projects, { ...DEFAULT, sort: 'due' }))).toEqual([
      'soon-new',
      'soon-old',
      'late',
      'none',
      'none2',
    ])
  })

  it('金額の高い順', () => {
    const projects = [
      project('small', { amount: 1000 }),
      project('large', { amount: 90000 }),
      project('mid', { amount: 30000 }),
    ]
    expect(ids(applyProjectListQuery(projects, { ...DEFAULT, sort: 'amount' }))).toEqual([
      'large',
      'mid',
      'small',
    ])
  })

  it('10件ずつに分け、並び替えの後でページを切る', () => {
    const projects = Array.from({ length: 12 }, (_, i) => project(String(i), { amount: i }))
    const page2 = applyProjectListQuery(projects, { ...DEFAULT, sort: 'amount', page: 2 })
    expect(ids(page2)).toEqual(['1', '0'])
    expect(page2).toMatchObject({ page: 2, pageCount: 2, total: 12, from: 11, to: 12 })
  })

  it('元の配列を並び替えない', () => {
    const projects = [project('a', { amount: 1 }), project('b', { amount: 2 })]
    applyProjectListQuery(projects, { ...DEFAULT, sort: 'amount' })
    expect(projects.map((p) => p.id)).toEqual(['a', 'b'])
  })
})

describe('filterProjectList(CSV 出力用)', () => {
  it('検索・絞り込み・並び替えは一覧と同じで、ページに分けず全件を返す', () => {
    const projects = Array.from({ length: 25 }, (_, i) =>
      project(String(i), { amount: i, status: i % 2 === 0 ? 'paid' : 'lost' }),
    )
    const result = filterProjectList(projects, { ...DEFAULT, status: 'paid', sort: 'amount' })
    expect(result.map((p) => p.id)).toEqual(
      ['24', '22', '20', '18', '16', '14', '12', '10', '8', '6', '4', '2', '0'],
    )
  })
})
