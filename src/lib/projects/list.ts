import {
  firstParam,
  matchesSearch,
  paginate,
  parsePage,
  parseSearch,
  pickOption,
  type Page,
  type SearchParams,
} from '@/lib/list/query'
import { isProjectStatus, type ProjectStatus } from './status'

export const PROJECT_SORTS = ['created', 'due', 'amount'] as const
export type ProjectSort = (typeof PROJECT_SORTS)[number]

export const PROJECT_SORT_LABELS: Record<ProjectSort, string> = {
  created: '登録の新しい順',
  due: '納期の近い順',
  amount: '金額の高い順',
}

export type ProjectListQuery = {
  q: string
  status: ProjectStatus | null
  sort: ProjectSort
  page: number
}

export function parseProjectListQuery(params: SearchParams): ProjectListQuery {
  const status = firstParam(params, 'status')
  return {
    q: parseSearch(firstParam(params, 'q')),
    status: isProjectStatus(status) ? status : null,
    sort: pickOption(firstParam(params, 'sort'), PROJECT_SORTS, 'created'),
    page: parsePage(firstParam(params, 'page')),
  }
}

/** URL に入れる値。既定値は入れない */
export function projectListParams(query: ProjectListQuery, page: number = query.page) {
  return {
    q: query.q,
    status: query.status,
    sort: query.sort === 'created' ? null : query.sort,
    page: page === 1 ? null : page,
  }
}

/** 検索・絞り込みの条件があるか(並び替えとページは含めない) */
export function hasProjectFilters(query: ProjectListQuery): boolean {
  return query.q !== '' || query.status !== null
}

type ListedProject = {
  title: string
  memo: string | null
  amount: number
  due_date: string | null
  status: ProjectStatus
  customer: { name: string }
}

const COMPARE: Record<ProjectSort, ((a: ListedProject, b: ListedProject) => number) | null> = {
  created: null,
  due: (a, b) => {
    if (a.due_date === b.due_date) return 0
    if (a.due_date === null) return 1
    if (b.due_date === null) return -1
    return a.due_date.localeCompare(b.due_date)
  },
  amount: (a, b) => b.amount - a.amount,
}

/**
 * 案件の一覧に、検索(題名・顧客名・メモ)、状態の絞り込み、並び替えをかける(ページ分割はしない)。
 * projects は登録の新しい順で渡す。同じ順位の案件は、その順のまま並べる
 */
export function filterProjectList<P extends ListedProject>(
  projects: readonly P[],
  query: Omit<ProjectListQuery, 'page'>,
): P[] {
  const filtered = projects.filter(
    (p) =>
      (query.status === null || p.status === query.status) &&
      matchesSearch([p.title, p.customer.name, p.memo], query.q),
  )
  const compare = COMPARE[query.sort]
  return compare ? filtered.toSorted(compare) : filtered
}

/** filterProjectList のあと、ページに分ける */
export function applyProjectListQuery<P extends ListedProject>(
  projects: readonly P[],
  query: ProjectListQuery,
): Page<P> {
  return paginate(filterProjectList(projects, query), query.page)
}
