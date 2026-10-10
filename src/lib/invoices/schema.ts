import { z } from 'zod'
import { yenAmount } from '@/lib/form-number'

// DB の check 制約(supabase/migrations の invoices)と同じ値にする
export const INVOICE_AMOUNT_MAX = 999_999_999

const date = (error: string) => z.string().trim().pipe(z.iso.date({ error }))

const optionalDate = (error: string) =>
  z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : value))
    .pipe(z.iso.date({ error }).nullable())

const invoiceInputSchema = z
  .object({
    project_id: z.uuid({ error: '案件を選んでください' }),
    amount: yenAmount(1, INVOICE_AMOUNT_MAX),
    issued_on: date('発行日を正しく入力してください'),
    due_on: date('支払期限を正しく入力してください'),
    paid_on: optionalDate('入金日を正しく入力してください'),
  })
  .superRefine(({ issued_on, due_on, paid_on }, ctx) => {
    if (due_on < issued_on) {
      ctx.addIssue({ code: 'custom', path: ['due_on'], message: '支払期限は発行日以降にしてください' })
    }
    if (paid_on !== null && paid_on < issued_on) {
      ctx.addIssue({ code: 'custom', path: ['paid_on'], message: '入金日は発行日以降にしてください' })
    }
  })

export type InvoiceInput = z.output<typeof invoiceInputSchema>
export type InvoiceField = keyof InvoiceInput
export type InvoiceFieldErrors = Partial<Record<InvoiceField, string>>

const FIELDS: readonly InvoiceField[] = ['project_id', 'amount', 'issued_on', 'due_on', 'paid_on']

const asString = (value: unknown) => (typeof value === 'string' ? value : '')

function toFieldErrors(error: z.ZodError): InvoiceFieldErrors {
  const fieldErrors: InvoiceFieldErrors = {}
  for (const issue of error.issues) {
    const field = FIELDS.find((name) => name === issue.path[0])
    if (field && !(field in fieldErrors)) fieldErrors[field] = issue.message
  }
  return fieldErrors
}

export function parseInvoiceInput(
  values: Record<string, unknown>,
): { success: true; data: InvoiceInput } | { success: false; fieldErrors: InvoiceFieldErrors } {
  const result = invoiceInputSchema.safeParse({
    project_id: asString(values.project_id),
    amount: asString(values.amount),
    issued_on: asString(values.issued_on),
    due_on: asString(values.due_on),
    paid_on: asString(values.paid_on),
  })
  return result.success
    ? { success: true, data: result.data }
    : { success: false, fieldErrors: toFieldErrors(result.error) }
}

/** 「入金を記録」の入金日。発行日より前は受け付けない */
export function parsePaidOn(
  value: unknown,
  issuedOn: string,
): { success: true; data: string } | { success: false; message: string } {
  const result = date('入金日を正しく入力してください').safeParse(asString(value))
  if (!result.success) return { success: false, message: result.error.issues[0].message }
  if (result.data < issuedOn) return { success: false, message: '入金日は発行日以降にしてください' }
  return { success: true, data: result.data }
}

export function isInvoiceId(value: string): boolean {
  return z.uuid().safeParse(value).success
}
