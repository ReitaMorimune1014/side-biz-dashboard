import { z } from 'zod'

// DB の check 制約(supabase/migrations の customers)と同じ値にする
export const CUSTOMER_NAME_MAX = 100
export const CUSTOMER_MEMO_MAX = 2000

export const customerInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: '名前を入力してください' })
    .max(CUSTOMER_NAME_MAX, { error: `名前は${CUSTOMER_NAME_MAX}文字以内で入力してください` }),
  memo: z
    .string()
    .max(CUSTOMER_MEMO_MAX, { error: `メモは${CUSTOMER_MEMO_MAX}文字以内で入力してください` })
    .transform((memo) => (memo.trim() === '' ? null : memo)),
})

export type CustomerInput = z.output<typeof customerInputSchema>
export type CustomerFieldErrors = Partial<Record<keyof CustomerInput, string>>

export const customerIdSchema = z.uuid()

export type ParseResult =
  | { success: true; data: CustomerInput }
  | { success: false; fieldErrors: CustomerFieldErrors }

/** フォームの値を検証する。エラーは項目ごとに最初の1つだけ返す */
export function parseCustomerInput(values: { name: unknown; memo: unknown }): ParseResult {
  const result = customerInputSchema.safeParse({
    name: typeof values.name === 'string' ? values.name : '',
    memo: typeof values.memo === 'string' ? values.memo : '',
  })
  if (result.success) return { success: true, data: result.data }

  const fieldErrors: CustomerFieldErrors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if ((field === 'name' || field === 'memo') && !fieldErrors[field]) {
      fieldErrors[field] = issue.message
    }
  }
  return { success: false, fieldErrors }
}

export function isCustomerId(value: string): boolean {
  return customerIdSchema.safeParse(value).success
}
