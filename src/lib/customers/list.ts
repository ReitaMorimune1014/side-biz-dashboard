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

export const CUSTOMER_SORTS = ['created', 'name'] as const
export type CustomerSort = (typeof CUSTOMER_SORTS)[number]

export const CUSTOMER_SORT_LABELS: Record<CustomerSort, string> = {
  created: '登録の新しい順',
  name: '名前順',
}

export type CustomerListQuery = { q: string; sort: CustomerSort; page: number }

export function parseCustomerListQuery(params: SearchParams): CustomerListQuery {
  return {
    q: parseSearch(firstParam(params, 'q')),
    sort: pickOption(firstParam(params, 'sort'), CUSTOMER_SORTS, 'created'),
    page: parsePage(firstParam(params, 'page')),
  }
}

/** URL に入れる値。既定値は入れない */
export function customerListParams(query: CustomerListQuery, page: number = query.page) {
  return {
    q: query.q,
    sort: query.sort === 'created' ? null : query.sort,
    page: page === 1 ? null : page,
  }
}

const collator = new Intl.Collator('ja')

export function hasCustomerFilters(query: CustomerListQuery): boolean {
  return query.q !== ''
}

/**
 * 顧客の一覧に、検索(名前・メモ)、並び替え、ページ分割をかける。
 * customers は登録の新しい順で渡す
 */
export function applyCustomerListQuery<C extends { name: string; memo: string | null }>(
  customers: readonly C[],
  query: CustomerListQuery,
): Page<C> {
  const filtered = customers.filter((c) => matchesSearch([c.name, c.memo], query.q))
  const sorted =
    query.sort === 'name' ? filtered.toSorted((a, b) => collator.compare(a.name, b.name)) : filtered
  return paginate(sorted, query.page)
}
