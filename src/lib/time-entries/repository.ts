import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { TimeEntryInput } from './schema'

type Client = SupabaseClient<Database>

export type TimeEntry = {
  id: string
  project_id: string
  work_date: string
  minutes: number
  memo: string | null
  project: { title: string }
}

const COLUMNS = 'id, project_id, work_date, minutes, memo, project:projects(title)'

type Row = {
  id: string
  project_id: string
  work_date: string
  minutes: number
  memo: string | null
  project: { title: string } | null
}

function toTimeEntry(row: Row): TimeEntry {
  return {
    id: row.id,
    project_id: row.project_id,
    work_date: row.work_date,
    minutes: row.minutes,
    memo: row.memo,
    project: { title: row.project?.title ?? '' },
  }
}

// 所有者の絞り込みは RLS が行う。ここでは user_id を扱わない

/** 日付の新しい順。同じ日付は、後から記録したものが先 */
export async function listTimeEntries(client: Client): Promise<TimeEntry[]> {
  const { data, error } = await client
    .from('time_entries')
    .select(COLUMNS)
    .order('work_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(toTimeEntry)
}

/** start〜end(どちらも含む)の日付の稼働の合計(分) */
export async function sumMinutesBetween(
  client: Client,
  start: string,
  end: string,
): Promise<number> {
  const { data, error } = await client
    .from('time_entries')
    .select('minutes')
    .gte('work_date', start)
    .lte('work_date', end)
  if (error) throw error
  return data.reduce((sum, row) => sum + row.minutes, 0)
}

export async function getTimeEntry(client: Client, id: string): Promise<TimeEntry | null> {
  const { data, error } = await client
    .from('time_entries')
    .select(COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? toTimeEntry(data) : null
}

export async function createTimeEntry(client: Client, input: TimeEntryInput): Promise<TimeEntry> {
  const { data, error } = await client.from('time_entries').insert(input).select(COLUMNS).single()
  if (error) throw error
  return toTimeEntry(data)
}

/** 見つからない(他人の稼働・削除済み)ときは null */
export async function updateTimeEntry(
  client: Client,
  id: string,
  input: TimeEntryInput,
): Promise<TimeEntry | null> {
  const { data, error } = await client
    .from('time_entries')
    .update(input)
    .eq('id', id)
    .select(COLUMNS)
    .maybeSingle()
  if (error) throw error
  return data ? toTimeEntry(data) : null
}

/** 削除できたら true。見つからない(他人の稼働・削除済み)ときは false */
export async function deleteTimeEntry(client: Client, id: string): Promise<boolean> {
  const { data, error } = await client.from('time_entries').delete().eq('id', id).select('id')
  if (error) throw error
  return data.length > 0
}
