import type { ProjectStatus } from '@/lib/projects/status'

/** 請求と連動させる案件の状態。納品前(着手金など)と失注は、請求があっても変えない */
const SYNCED: readonly ProjectStatus[] = ['delivered', 'invoiced', 'paid']

/**
 * 案件の請求をすべて見て、案件の状態を決め直す。
 * - 1つ以上あり、すべて入金済 → 入金済
 * - 未入金(期限切れを含む)が1つでもある → 請求済
 * - 1つもない → 納品
 */
export function projectStatusFromInvoices(
  current: ProjectStatus,
  invoices: readonly { paid_on: string | null }[],
): ProjectStatus {
  if (!SYNCED.includes(current)) return current
  if (invoices.length === 0) return 'delivered'
  return invoices.every((invoice) => invoice.paid_on !== null) ? 'paid' : 'invoiced'
}
