const yenFormatter = new Intl.NumberFormat('ja-JP')

/** 整数の円を「120,000円」の形で表示する */
export function formatYen(amount: number): string {
  if (!Number.isInteger(amount)) throw new RangeError('金額は整数の円で渡してください')
  return `${yenFormatter.format(amount)}円`
}
