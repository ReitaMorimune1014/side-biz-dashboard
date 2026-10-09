const yenFormatter = new Intl.NumberFormat('ja-JP')

/** 整数の円を「120,000円」の形で表示する */
export function formatYen(amount: number): string {
  if (!Number.isInteger(amount)) throw new RangeError('金額は整数の円で渡してください')
  return `${yenFormatter.format(amount)}円`
}

/** グラフの棒に添える短い表示。1万円以上は「12.5万」の形(小数1桁で四捨五入) */
export function formatCompactYen(amount: number): string {
  if (amount < 10_000) return formatYen(amount)
  return `${yenFormatter.format(Math.round(amount / 1_000) / 10)}万`
}
