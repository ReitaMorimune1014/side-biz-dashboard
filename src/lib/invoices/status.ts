export const INVOICE_STATUSES = ['unpaid', 'paid', 'overdue'] as const

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: '未入金',
  paid: '入金済',
  overdue: '期限切れ',
}

/**
 * 状態は保存せず、入金日と支払期限から決める。
 * 支払期限の当日はまだ未入金で、翌日から期限切れ。日付は YYYY-MM-DD(日本時間)
 */
export function invoiceStatus(
  invoice: { due_on: string; paid_on: string | null },
  today: string,
): InvoiceStatus {
  if (invoice.paid_on !== null) return 'paid'
  return invoice.due_on < today ? 'overdue' : 'unpaid'
}
