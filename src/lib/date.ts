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

const TOKYO_DATE_TIME = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** 日時(ISO 8601)を、日本時間の「2026/10/09 18:05」の形で表す */
export function formatDateTimeInTokyo(timestamp: string): string {
  const parts = Object.fromEntries(
    TOKYO_DATE_TIME.formatToParts(new Date(timestamp)).map((p) => [p.type, p.value]),
  )
  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

/** YYYY-MM-DD を「2026/10/09(金)」の形で表す */
export function formatDateWithWeekday(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${date.replaceAll('-', '/')}(${weekday})`
}
