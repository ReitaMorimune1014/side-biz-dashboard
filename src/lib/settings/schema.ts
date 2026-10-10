import { z } from 'zod'
import { wholeNumber } from '@/lib/form-number'
import { readFields } from '@/lib/forms/form-values'
import type { Weekday } from '@/lib/weekly/week'

// DB の既定値と check 制約(supabase/migrations の user_settings)と同じ値にする
export const DEFAULT_SETTINGS: Settings = { weekly_target_minutes: 300, week_start: 1 }
export const WEEKLY_TARGET_MINUTES_MAX = 7 * 24 * 60

const HOURS_MAX = WEEKLY_TARGET_MINUTES_MAX / 60

export type Settings = { weekly_target_minutes: number; week_start: Weekday }

const settingsInputSchema = z
  .object({
    hours: wholeNumber(HOURS_MAX, `時間は0〜${HOURS_MAX}の整数で入力してください`),
    minutes: wholeNumber(59, '分は0〜59の整数で入力してください'),
    week_start: z
      .string()
      .regex(/^[0-6]$/, { error: '曜日を選んでください' })
      .transform((value) => Number(value) as Weekday),
  })
  .superRefine(({ hours, minutes }, ctx) => {
    const total = hours * 60 + minutes
    if (total === 0) {
      ctx.addIssue({ code: 'custom', path: ['target'], message: '目標時間を入力してください' })
    } else if (total > WEEKLY_TARGET_MINUTES_MAX) {
      ctx.addIssue({
        code: 'custom',
        path: ['target'],
        message: `目標時間は${HOURS_MAX}時間以内で入力してください`,
      })
    }
  })
  .transform(
    ({ hours, minutes, week_start }): Settings => ({
      weekly_target_minutes: hours * 60 + minutes,
      week_start,
    }),
  )

/** 「時間」と「分」の欄のエラーは、まとめて target に出す */
export type SettingsField = 'target' | 'week_start'
export type SettingsFieldErrors = Partial<Record<SettingsField, string>>

const FIELD_OF: Record<string, SettingsField> = {
  hours: 'target',
  minutes: 'target',
  target: 'target',
  week_start: 'week_start',
}

/** 入力欄の name から、エラーを出す項目を決める */
export function settingsFieldOf(name: string): SettingsField | undefined {
  return Object.hasOwn(FIELD_OF, name) ? FIELD_OF[name] : undefined
}

export const SETTINGS_FORM_FIELDS = ['hours', 'minutes', 'week_start'] as const
export type SettingsFormValues = Partial<Record<(typeof SETTINGS_FORM_FIELDS)[number], string>>

export function readSettingsForm(formData: FormData): SettingsFormValues {
  return readFields(formData, SETTINGS_FORM_FIELDS)
}

const asString = (value: unknown) => (typeof value === 'string' ? value : '')

export function parseSettingsInput(
  values: Record<string, unknown>,
): { success: true; data: Settings } | { success: false; fieldErrors: SettingsFieldErrors } {
  const result = settingsInputSchema.safeParse({
    hours: asString(values.hours),
    minutes: asString(values.minutes),
    week_start: asString(values.week_start),
  })
  if (result.success) return { success: true, data: result.data }

  const fieldErrors: SettingsFieldErrors = {}
  for (const issue of result.error.issues) {
    const path = issue.path[0]
    const field = typeof path === 'string' ? settingsFieldOf(path) : undefined
    if (field && !(field in fieldErrors)) fieldErrors[field] = issue.message
  }
  return { success: false, fieldErrors }
}
