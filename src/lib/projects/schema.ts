import { z } from 'zod'
import { PROJECT_STATUSES, type ProjectStatus } from './status'

// DB の check 制約(supabase/migrations の projects)と同じ値にする
export const PROJECT_TITLE_MAX = 100
export const PROJECT_MEMO_MAX = 2000
export const PROJECT_AMOUNT_MAX = 999_999_999

const projectInputSchema = z.object({
  customer_id: z.uuid({ error: '顧客を選んでください' }),
  title: z
    .string()
    .trim()
    .min(1, { error: '題名を入力してください' })
    .max(PROJECT_TITLE_MAX, { error: `題名は${PROJECT_TITLE_MAX}文字以内で入力してください` }),
  amount: z
    .string()
    .trim()
    .transform((value) => value.replaceAll(',', ''))
    .pipe(
      z
        .string()
        .min(1, { error: '金額を入力してください' })
        .regex(/^\d+$/, { error: '金額は0以上の整数(円)で入力してください' }),
    )
    .transform(Number)
    .pipe(
      z
        .number()
        .max(PROJECT_AMOUNT_MAX, { error: `金額は${PROJECT_AMOUNT_MAX.toLocaleString('ja-JP')}円以内で入力してください` }),
    ),
  due_date: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : value))
    .pipe(z.iso.date({ error: '納期は正しい日付で入力してください' }).nullable()),
  memo: z
    .string()
    .max(PROJECT_MEMO_MAX, { error: `メモは${PROJECT_MEMO_MAX}文字以内で入力してください` })
    .transform((memo) => (memo.trim() === '' ? null : memo)),
})

const statusChangeSchema = z.object({
  status: z.enum(PROJECT_STATUSES, { error: '状態を選んでください' }),
  expected_status: z.enum(PROJECT_STATUSES),
})

export type ProjectInput = z.output<typeof projectInputSchema>
export type ProjectField = keyof ProjectInput | 'status'
export type ProjectFieldErrors = Partial<Record<ProjectField, string>>
export type StatusChange = { from: ProjectStatus; to: ProjectStatus }

type FormValues = Record<string, unknown>

const asString = (value: unknown) => (typeof value === 'string' ? value : '')

function toFieldErrors(error: z.ZodError): ProjectFieldErrors {
  const fieldErrors: ProjectFieldErrors = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    const key = field === 'expected_status' ? 'status' : field
    if (typeof key === 'string' && !(key in fieldErrors)) {
      fieldErrors[key as ProjectField] = issue.message
    }
  }
  return fieldErrors
}

export function parseProjectInput(
  values: FormValues,
): { success: true; data: ProjectInput } | { success: false; fieldErrors: ProjectFieldErrors } {
  const result = projectInputSchema.safeParse({
    customer_id: asString(values.customer_id),
    title: asString(values.title),
    amount: asString(values.amount),
    due_date: asString(values.due_date),
    memo: asString(values.memo),
  })
  return result.success
    ? { success: true, data: result.data }
    : { success: false, fieldErrors: toFieldErrors(result.error) }
}

/** 編集フォームの「状態」と「開いたときの状態」を読む */
export function parseStatusChange(
  values: FormValues,
): { success: true; data: StatusChange } | { success: false; fieldErrors: ProjectFieldErrors } {
  const result = statusChangeSchema.safeParse({
    status: values.status,
    expected_status: values.expected_status,
  })
  return result.success
    ? { success: true, data: { from: result.data.expected_status, to: result.data.status } }
    : { success: false, fieldErrors: toFieldErrors(result.error) }
}

export function isProjectId(value: string): boolean {
  return z.uuid().safeParse(value).success
}
