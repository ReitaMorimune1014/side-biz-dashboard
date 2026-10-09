/** 0 = 日曜 … 6 = 土曜(Date#getDay と同じ) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: '日曜',
  1: '月曜',
  2: '火曜',
  3: '水曜',
  4: '木曜',
  5: '金曜',
  6: '土曜',
}

export function isWeekday(value: unknown): value is Weekday {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6
}

function parseDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

/**
 * today(YYYY-MM-DD)を含む週の、初日と最終日(どちらも含む)。
 * 日付だけで計算するので、時差は today を求めるときに扱う
 */
export function weekRange(today: string, weekStart: Weekday): { start: string; end: string } {
  const date = parseDate(today)
  const offset = (date.getUTCDay() - weekStart + 7) % 7
  const start = addDays(date, -offset)
  return { start: formatDate(start), end: formatDate(addDays(start, 6)) }
}
