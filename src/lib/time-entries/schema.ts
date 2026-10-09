import { z } from 'zod'
import { wholeNumber } from '@/lib/form-number'
import { readFields } from '@/lib/forms/form-values'

// DB の check 制約(supabase/migrations の time_entries)と同じ値にする
export const TIME_ENTRY_MINUTES_MAX = 1440
export const TIME_ENTRY_MEMO_MAX = 2000

const HOURS_MAX = TIME_ENTRY_MINUTES_MAX / 60

const timeEntryInputSchema = z
  .object({
    project_id: z.uuid({ error: '案件を選んでください' }),
    work_date: z.iso.date({ error: '日付を正しく入力してください' }),
    hours: wholeNumber(HOURS_MAX, `時間は0〜${HOURS_MAX}の整数で入力してください`),
    minutes: wholeNumber(59, '分は0〜59の整数で入力してください'),
    memo: z
      .string()
      .max(TIME_ENTRY_MEMO_MAX, { error: `メモは${TIME_ENTRY_MEMO_MAX}文字以内で入力してください` })
      .transform((memo) => (memo.trim() === '' ? null : memo)),
  })
  .superRefine(({ hours, minutes }, ctx) => {
    const total = hours * 60 + minutes
    if (total === 0) {
      ctx.addIssue({ code: 'custom', path: ['duration'], message: '稼働時間を入力してください' })
    } else if (total > TIME_ENTRY_MINUTES_MAX) {
      ctx.addIssue({
        code: 'custom',
        path: ['duration'],
        message: `稼働時間は${HOURS_MAX}時間以内で入力してください`,
      })
    }
  })
  .transform(({ hours, minutes, ...rest }) => ({ ...rest, minutes: hours * 60 + minutes }))

export type TimeEntryInput = z.output<typeof timeEntryInputSchema>
/** 「時間」と「分」の欄のエラーは、まとめて duration に出す */
export type TimeEntryField = 'project_id' | 'work_date' | 'duration' | 'memo'
export type TimeEntryFieldErrors = Partial<Record<TimeEntryField, string>>

const FIELD_OF: Record<string, TimeEntryField> = {
  project_id: 'project_id',
  work_date: 'work_date',
  hours: 'duration',
  minutes: 'duration',
  duration: 'duration',
  memo: 'memo',
}

/** 入力欄の name から、エラーを出す項目を決める */
export function timeEntryFieldOf(name: string): TimeEntryField | undefined {
  return Object.hasOwn(FIELD_OF, name) ? FIELD_OF[name] : undefined
}

export const TIME_ENTRY_FORM_FIELDS = ['project_id', 'work_date', 'hours', 'minutes', 'memo'] as const
export type TimeEntryFormValues = Partial<Record<(typeof TIME_ENTRY_FORM_FIELDS)[number], string>>

export function readTimeEntryForm(formData: FormData): TimeEntryFormValues {
  return readFields(formData, TIME_ENTRY_FORM_FIELDS)
}

const asString = (value: unknown) => (typeof value === 'string' ? value : '')

export function parseTimeEntryInput(
  values: Record<string, unknown>,
): { success: true; data: TimeEntryInput } | { success: false; fieldErrors: TimeEntryFieldErrors } {
  const result = timeEntryInputSchema.safeParse({
    project_id: asString(values.project_id),
    work_date: asString(values.work_date),
    hours: asString(values.hours),
    minutes: asString(values.minutes),
    memo: asString(values.memo),
  })
  if (result.success) return { success: true, data: result.data }

  const fieldErrors: TimeEntryFieldErrors = {}
  for (const issue of result.error.issues) {
    const path = issue.path[0]
    const field = typeof path === 'string' ? timeEntryFieldOf(path) : undefined
    if (field && !(field in fieldErrors)) fieldErrors[field] = issue.message
  }
  return { success: false, fieldErrors }
}

export function isTimeEntryId(value: string): boolean {
  return z.uuid().safeParse(value).success
}
