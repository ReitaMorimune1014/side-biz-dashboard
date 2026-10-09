/** 一覧の1ページの件数 */
export const PAGE_SIZE = 10

export type SearchParams = Record<string, string | string[] | undefined>

/** 同じ名前のパラメータが複数あれば、最初の値を使う */
export function firstParam(params: SearchParams, name: string): string {
  const value = params[name]
  return (Array.isArray(value) ? value[0] : value) ?? ''
}

/** 決まった値のどれかなら、その値。違えば既定値 */
export function pickOption<T extends string>(value: string, options: readonly T[], fallback: T): T {
  return (options as readonly string[]).includes(value) ? (value as T) : fallback
}

/** 1以上の整数ならそのページ。読めなければ1ページ目 */
export function parsePage(value: string): number {
  if (!/^\d{1,6}$/.test(value)) return 1
  return Math.max(Number(value), 1)
}

/** 検索のために、全角・半角と大文字・小文字の違いをなくす */
export function normalizeText(text: string): string {
  return text.normalize('NFKC').toLowerCase()
}

/** 検索語は前後の空白を除き、長すぎる分は切る */
export function parseSearch(value: string): string {
  return value.trim().slice(0, 100)
}

/**
 * 検索語を空白で区切り、どの語も、いずれかの項目に含まれていれば一致とする。
 * 検索語が空なら、すべて一致
 */
export function matchesSearch(fields: readonly (string | null)[], query: string): boolean {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const haystack = fields.filter((f): f is string => f !== null).map(normalizeText)
  return terms.every((term) => haystack.some((field) => field.includes(term)))
}

export type Page<T> = {
  items: T[]
  /** 範囲外のページを頼まれたときは、最後のページ(か1ページ目)に直した値 */
  page: number
  /** 0件でも1 */
  pageCount: number
  total: number
  /** このページの最初と最後が、全体の何件目か(1始まり)。0件なら0 */
  from: number
  to: number
}

export function paginate<T>(items: readonly T[], page: number, size: number = PAGE_SIZE): Page<T> {
  const total = items.length
  const pageCount = Math.max(Math.ceil(total / size), 1)
  const current = Math.min(Math.max(page, 1), pageCount)
  const start = (current - 1) * size
  const pageItems = items.slice(start, start + size)
  return {
    items: pageItems,
    page: current,
    pageCount,
    total,
    from: pageItems.length === 0 ? 0 : start + 1,
    to: start + pageItems.length,
  }
}

/**
 * ページ番号の並び。最初・最後・今のページの前後1つを出し、間は 'gap' にする。
 * 例: 今が5/10 → [1, 'gap', 4, 5, 6, 'gap', 10]
 */
export function pageNumbers(page: number, pageCount: number): (number | 'gap')[] {
  const shown = new Set([1, pageCount, page - 1, page, page + 1])
  const numbers = [...shown].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b)
  const result: (number | 'gap')[] = []
  numbers.forEach((n, i) => {
    const prev = numbers[i - 1]
    if (prev !== undefined && n - prev === 2) result.push(prev + 1)
    else if (prev !== undefined && n - prev > 2) result.push('gap')
    result.push(n)
  })
  return result
}

/** 一覧の URL。空の値と既定値は URL に入れない */
export function listHref(path: string, params: Record<string, string | number | null>): string {
  const search = new URLSearchParams()
  for (const [name, value] of Object.entries(params)) {
    if (value === null || value === '') continue
    search.set(name, String(value))
  }
  const query = search.toString()
  return query ? `${path}?${query}` : path
}
