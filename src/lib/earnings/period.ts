/** 日ごと(1か月分)・月ごと(1年分)・年ごと(全期間) */
export type Period =
  | { view: 'day'; year: number; month: number }
  | { view: 'month'; year: number }
  | { view: 'year' }

export type PeriodView = Period['view']

const MIN_YEAR = 2000
const MAX_YEAR = 2100

const pad = (n: number) => String(n).padStart(2, '0')

/** URL の view と at から期間を読む。読めなければ、今日を含む期間にする(既定は月ごと) */
export function parsePeriod(
  params: { view?: string; at?: string },
  today: string,
): Period {
  const [thisYear, thisMonth] = today.split('-').map(Number)
  const at = params.at ?? ''

  if (params.view === 'year') return { view: 'year' }

  if (params.view === 'day') {
    const match = /^(\d{4})-(\d{2})$/.exec(at)
    const year = match ? Number(match[1]) : NaN
    const month = match ? Number(match[2]) : NaN
    if (year >= MIN_YEAR && year <= MAX_YEAR && month >= 1 && month <= 12) {
      return { view: 'day', year, month }
    }
    return { view: 'day', year: thisYear, month: thisMonth }
  }

  const year = /^\d{4}$/.test(at) ? Number(at) : NaN
  if (year >= MIN_YEAR && year <= MAX_YEAR) return { view: 'month', year }
  return { view: 'month', year: thisYear }
}

/** URL の at に入れる値。年ごとは使わない */
export function periodParam(period: Period): string | null {
  switch (period.view) {
    case 'day':
      return `${period.year}-${pad(period.month)}`
    case 'month':
      return String(period.year)
    case 'year':
      return null
  }
}

export function periodLabel(period: Period): string {
  switch (period.view) {
    case 'day':
      return `${period.year}年${period.month}月`
    case 'month':
      return `${period.year}年`
    case 'year':
      return '全期間'
  }
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** 期間の初日と最終日(どちらも含む)。全期間は null */
export function periodRange(period: Period): { start: string; end: string } | null {
  switch (period.view) {
    case 'day': {
      const prefix = `${period.year}-${pad(period.month)}`
      return { start: `${prefix}-01`, end: `${prefix}-${pad(daysInMonth(period.year, period.month))}` }
    }
    case 'month':
      return { start: `${period.year}-01-01`, end: `${period.year}-12-31` }
    case 'year':
      return null
  }
}

/** 前(-1)・次(+1)の期間。全期間は前後がないので null */
export function shiftPeriod(period: Period, delta: -1 | 1): Period | null {
  switch (period.view) {
    case 'day': {
      const index = period.year * 12 + (period.month - 1) + delta
      const year = Math.floor(index / 12)
      if (year < MIN_YEAR || year > MAX_YEAR) return null
      return { view: 'day', year, month: (index % 12) + 1 }
    }
    case 'month': {
      const year = period.year + delta
      if (year < MIN_YEAR || year > MAX_YEAR) return null
      return { view: 'month', year }
    }
    case 'year':
      return null
  }
}

/**
 * 表示の単位を切り替えるときは、今見ている年や月を引き継ぐ。
 * 月ごとから日ごとにするときは、今年なら今月、ほかの年なら1月にする
 */
export function switchView(view: PeriodView, current: Period, today: string): Period {
  const [thisYear, thisMonth] = today.split('-').map(Number)
  const year = current.view === 'year' ? thisYear : current.year
  switch (view) {
    case 'day':
      return {
        view,
        year,
        month: current.view === 'day' ? current.month : year === thisYear ? thisMonth : 1,
      }
    case 'month':
      return { view, year }
    case 'year':
      return { view }
  }
}

export type BucketSlot = { key: string; label: string }

/**
 * グラフの棒の並び。日ごとは月の日数、月ごとは12か月、
 * 年ごとは、売上のある最初の年から今年(か売上のある最後の年)まで
 */
export function bucketSlots(period: Period, earnedYears: readonly number[], thisYear: number): BucketSlot[] {
  switch (period.view) {
    case 'day': {
      const prefix = `${period.year}-${pad(period.month)}`
      return Array.from({ length: daysInMonth(period.year, period.month) }, (_, i) => ({
        key: `${prefix}-${pad(i + 1)}`,
        label: `${i + 1}日`,
      }))
    }
    case 'month':
      return Array.from({ length: 12 }, (_, i) => ({
        key: `${period.year}-${pad(i + 1)}`,
        label: `${i + 1}月`,
      }))
    case 'year': {
      const first = Math.min(thisYear, ...earnedYears)
      const last = Math.max(thisYear, ...earnedYears)
      return Array.from({ length: last - first + 1 }, (_, i) => ({
        key: String(first + i),
        label: `${first + i}年`,
      }))
    }
  }
}

/** 売上日を、期間の棒のキーにする(日ごと: 日付、月ごと: 年月、年ごと: 年) */
export function bucketKeyOf(period: Period, earnedOn: string): string {
  switch (period.view) {
    case 'day':
      return earnedOn
    case 'month':
      return earnedOn.slice(0, 7)
    case 'year':
      return earnedOn.slice(0, 4)
  }
}
