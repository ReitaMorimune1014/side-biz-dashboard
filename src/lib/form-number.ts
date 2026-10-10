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
