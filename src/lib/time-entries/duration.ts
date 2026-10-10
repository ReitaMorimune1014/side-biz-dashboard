/** 分を「1時間30分」の形で表す */
export function formatMinutes(total: number): string {
  const { hours, minutes } = splitMinutes(total)
  if (hours === 0) return `${minutes}分`
  if (minutes === 0) return `${hours}時間`
  return `${hours}時間${minutes}分`
}

/** 編集フォームの「時間」「分」の欄に入れるため、分を分ける */
export function splitMinutes(total: number): { hours: number; minutes: number } {
  return { hours: Math.floor(total / 60), minutes: total % 60 }
}
