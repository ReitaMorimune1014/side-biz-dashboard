const TOKYO_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** 日本時間の今日を YYYY-MM-DD で返す(サーバーは UTC で動くことがあるため、時差を明示する) */
export function todayInTokyo(now: Date = new Date()): string {
  return TOKYO_DATE.format(now)
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

/** YYYY-MM-DD を「2026/10/09(金)」の形で表す */
export function formatDateWithWeekday(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${date.replaceAll('-', '/')}(${weekday})`
}
