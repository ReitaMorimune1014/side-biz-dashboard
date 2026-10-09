import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { InvoiceInput } from './schema'

type Client = SupabaseClient<Database>

export type Invoice = {
  id: string
  project_id: string
  amount: number
  issued_on: string
  due_on: string
  paid_on: string | null
  project: { title: string; customer_name: string }
}

const COLUMNS =
  'id, project_id, amount, issued_on, due_on, paid_on, project:projects(title, customer:customers(name))'

type Row = {
  id: string
  project_id: string
  amount: number
  issued_on: string
  due_on: string
  paid_on: string | null
  project: { title: string; customer: { name: string } | null } | null
}

function toInvoice(row: Row): Invoice {
  return {
    id: row.id,
    project_id: row.project_id,
    amount: row.amount,
    issued_on: row.issued_on,
    due_on: row.due_on,
    paid_on: row.paid_on,
    project: {
      title: row.project?.title ?? '',
      customer_name: row.project?.customer?.name ?? '',
    },
  }
}

// 所有者の絞り込みは RLS が行う。ここでは user_id を扱わない

/** 発行日の新しい順。同じ日は、後から作ったものが先 */
export async function listInvoices(client: Client): Promise<Invoice[]> {
  const { data, error } = await client
    .from('invoices')
    .select(COLUMNS)
    .order('issued_on', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(toInvoice)
}

export async function getInvoice(client: Client, id: string): Promise<Invoice | null> {
  const { data, error } = await client.from('invoices').select(COLUMNS).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? toInvoice(data) : null
}

export async function createInvoice(client: Client, input: InvoiceInput): Promise<Invoice> {
  const { data, error } = await client.from('invoices').insert(input).select(COLUMNS).single()
  if (error) throw error
  return toInvoice(data)
}

/** 見つからない(他人の請求・削除済み)ときは null */
export async function updateInvoice(
  client: Client,
  id: string,
  values: Partial<InvoiceInput>,
): Promise<Invoice | null> {
  const { data, error } = await client
    .from('invoices')
    .update(values)
    .eq('id', id)
    .select(COLUMNS)
    .maybeSingle()
  if (error) throw error
  return data ? toInvoice(data) : null
}

/** 入金日を記録する。null を渡すと未入金に戻す */
export async function setInvoicePaidOn(
  client: Client,
  id: string,
  paidOn: string | null,
): Promise<Invoice | null> {
  return updateInvoice(client, id, { paid_on: paidOn })
}

/** 削除できたら true。見つからない(他人の請求・削除済み)ときは false */
export async function deleteInvoice(client: Client, id: string): Promise<boolean> {
  const { data, error } = await client.from('invoices').delete().eq('id', id).select('id')
  if (error) throw error
  return data.length > 0
}
