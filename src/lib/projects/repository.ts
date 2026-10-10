import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { ProjectInput, StatusChange } from './schema'
import { canTransition, isProjectStatus, type ProjectStatus } from './status'

type Client = SupabaseClient<Database>

export type Project = {
  id: string
  customer_id: string
  title: string
  amount: number
  due_date: string | null
  status: ProjectStatus
  memo: string | null
  customer: { name: string; deleted: boolean }
}

const COLUMNS =
  'id, customer_id, title, amount, due_date, status, memo, customer:customers(name, deleted_at)'

type Row = {
  id: string
  customer_id: string
  title: string
  amount: number
  due_date: string | null
  status: string
  memo: string | null
  customer: { name: string; deleted_at: string | null } | null
}

function toProject(row: Row): Project {
  if (!isProjectStatus(row.status)) throw new Error(`unknown project status: ${row.status}`)
  return {
    id: row.id,
    customer_id: row.customer_id,
    title: row.title,
    amount: row.amount,
    due_date: row.due_date,
    status: row.status,
    memo: row.memo,
    customer: {
      name: row.customer?.name ?? '',
      deleted: row.customer?.deleted_at != null,
    },
  }
}

// 所有者の絞り込みは RLS が行う。ここでは user_id を扱わない

/** 新しい順に返す */
export async function listProjects(client: Client): Promise<Project[]> {
  const { data, error } = await client
    .from('projects')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(toProject)
}

export async function getProject(client: Client, id: string): Promise<Project | null> {
  const { data, error } = await client.from('projects').select(COLUMNS).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? toProject(data) : null
}

/** 状態は DB の既定値(見積)から始まる */
export async function createProject(client: Client, input: ProjectInput): Promise<Project> {
  const { data, error } = await client.from('projects').insert(input).select(COLUMNS).single()
  if (error) throw error
  return toProject(data)
}

export type UpdateProjectResult =
  | { ok: true; project: Project }
  | { ok: false; reason: 'invalid_transition' | 'conflict' | 'not_found' }

/**
 * 項目と状態をまとめて更新する。
 * 状態は「フォームを開いたときの状態(from)」が DB と一致するときだけ変える。
 * 別の画面で先に状態が変わっていたら conflict を返す。
 */
export async function updateProject(
  client: Client,
  id: string,
  input: ProjectInput,
  change: StatusChange,
): Promise<UpdateProjectResult> {
  if (!canTransition(change.from, change.to)) return { ok: false, reason: 'invalid_transition' }

  const { data, error } = await client
    .from('projects')
    .update({ ...input, status: change.to })
    .eq('id', id)
    .eq('status', change.from)
    .select(COLUMNS)
    .maybeSingle()
  if (error) throw error
  if (data) return { ok: true, project: toProject(data) }

  const current = await getProject(client, id)
  return { ok: false, reason: current ? 'conflict' : 'not_found' }
}
