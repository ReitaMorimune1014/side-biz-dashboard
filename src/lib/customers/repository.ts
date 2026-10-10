import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { CustomerInput } from './schema'

type Client = SupabaseClient<Database>
type CustomerRow = Database['public']['Tables']['customers']['Row']

export type Customer = Pick<CustomerRow, 'id' | 'name' | 'memo' | 'created_at' | 'updated_at'>

const COLUMNS = 'id, name, memo, created_at, updated_at'

// 所有者の絞り込みは RLS が行う。ここでは user_id を扱わない

/** 論理削除していない顧客を、新しい順に返す */
export async function listActiveCustomers(client: Client): Promise<Customer[]> {
  const { data, error } = await client
    .from('customers')
    .select(COLUMNS)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/** 顧客の ID から名前を引く表。履歴の表示用なので、論理削除した顧客も含める */
export async function getCustomerNames(
  client: Client,
  ids: readonly string[],
): Promise<Map<string, { name: string; deleted: boolean }>> {
  if (ids.length === 0) return new Map()
  const { data, error } = await client
    .from('customers')
    .select('id, name, deleted_at')
    .in('id', [...new Set(ids)])
  if (error) throw error
  return new Map(data.map((c) => [c.id, { name: c.name, deleted: c.deleted_at !== null }]))
}

export async function getActiveCustomer(client: Client, id: string): Promise<Customer | null> {
  const { data, error } = await client
    .from('customers')
    .select(COLUMNS)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createCustomer(client: Client, input: CustomerInput): Promise<Customer> {
  const { data, error } = await client.from('customers').insert(input).select(COLUMNS).single()
  if (error) throw error
  return data
}

/** 見つからない(他人の顧客・論理削除済み・存在しない)ときは null */
export async function updateCustomer(
  client: Client,
  id: string,
  input: CustomerInput,
): Promise<Customer | null> {
  const { data, error } = await client
    .from('customers')
    .update(input)
    .eq('id', id)
    .is('deleted_at', null)
    .select(COLUMNS)
    .maybeSingle()
  if (error) throw error
  return data
}

/** 論理削除する。見つからない(他人の顧客・論理削除済み・存在しない)ときは false */
export async function softDeleteCustomer(client: Client, id: string): Promise<boolean> {
  const { data, error } = await client
    .from('customers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
  if (error) throw error
  return data.length === 1
}
