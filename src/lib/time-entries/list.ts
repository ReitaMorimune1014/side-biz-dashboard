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
import { isProjectId } from '@/lib/projects/schema'

export const TIME_ENTRY_SORTS = ['newest', 'oldest'] as const
export type TimeEntrySort = (typeof TIME_ENTRY_SORTS)[number]

export const TIME_ENTRY_SORT_LABELS: Record<TimeEntrySort, string> = {
  newest: '日付の新しい順',
  oldest: '日付の古い順',
}

export type TimeEntryListQuery = {
  q: string
  /** 絞り込む案件の ID */
  project: string | null
  sort: TimeEntrySort
  page: number
}

export function parseTimeEntryListQuery(params: SearchParams): TimeEntryListQuery {
  const project = firstParam(params, 'project')
  return {
    q: parseSearch(firstParam(params, 'q')),
    project: isProjectId(project) ? project : null,
    sort: pickOption(firstParam(params, 'sort'), TIME_ENTRY_SORTS, 'newest'),
    page: parsePage(firstParam(params, 'page')),
  }
}

/** URL に入れる値。既定値は入れない */
export function timeEntryListParams(query: TimeEntryListQuery, page: number = query.page) {
  return {
    q: query.q,
    project: query.project,
    sort: query.sort === 'newest' ? null : query.sort,
    page: page === 1 ? null : page,
  }
}

export function hasTimeEntryFilters(query: TimeEntryListQuery): boolean {
  return query.q !== '' || query.project !== null
}

/**
 * 稼働の一覧に、検索(案件名・メモ)、案件の絞り込み、並び替え、ページ分割をかける。
 * entries は日付の新しい順(同じ日は後の記録が先)で渡す。古い順は、その逆にする
 */
export function applyTimeEntryListQuery<
  E extends { project_id: string; memo: string | null; project: { title: string } },
>(entries: readonly E[], query: TimeEntryListQuery): Page<E> {
  const filtered = entries.filter(
    (e) =>
      (query.project === null || e.project_id === query.project) &&
      matchesSearch([e.project.title, e.memo], query.q),
  )
  return paginate(query.sort === 'oldest' ? filtered.toReversed() : filtered, query.page)
}
