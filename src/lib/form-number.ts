import { z } from 'zod'

/** 「時間」「分」の欄のように、空欄を 0 として読む 0 以上 max 以下の整数 */
export function wholeNumber(max: number, message: string) {
  return z
    .string()
    .trim()
    .transform((value) => (value === '' ? '0' : value))
    .pipe(z.string().regex(/^\d{1,4}$/, { error: message }))
    .transform(Number)
    .pipe(z.number().max(max, { error: message }))
}

/** 税込の円(整数)。「120,000」のようなカンマ区切りも受け付ける */
export function yenAmount(min: number, max: number) {
  const notInteger = `金額は${min}以上の整数(円)で入力してください`
  return z
    .string()
    .trim()
    .transform((value) => value.replaceAll(',', ''))
    .pipe(
      z
        .string()
        .min(1, { error: '金額を入力してください' })
        .regex(/^\d+$/, { error: notInteger }),
    )
    .transform(Number)
    .pipe(
      z
        .number()
        .min(min, { error: notInteger })
        .max(max, { error: `金額は${max.toLocaleString('ja-JP')}円以内で入力してください` }),
    )
}
