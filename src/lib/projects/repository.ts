import type { SupabaseClient } from '@supabase/supabase-js'
import { todayInTokyo } from '@/lib/date'
import type { Database } from '@/lib/supabase/database.types'
import { earnedOnPatch } from './earned'
import { isHistoryOperation, parseHistoryChanges, type ProjectHistoryEntry } from './history'
import type { ProjectInput, StatusChange } from './schema'
import { isProjectStatus, type ProjectStatus } from './status'

type Client = SupabaseClient<Database>

export type Project = {
  id: string
  customer_id: string
  title: string
  amount: number
  due_date: string | null
  status: ProjectStatus
  memo: string | null
  /** 売上日。納品・請求済・入金済のときだけある */
  earned_on: string | null
  customer: { name: string; deleted: boolean }
}

const COLUMNS =
  'id, customer_id, title, amount, due_date, status, memo, earned_on, customer:customers(name, deleted_at)'

type Row = {
  id: string
  customer_id: string
  title: string
  amount: number
  due_date: string | null
  status: string
  memo: string | null
  earned_on: string | null
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
    earned_on: row.earned_on,
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

/** 案件の変更履歴を、新しい順に返す(記録は DB のトリガーが行う) */
export async function listProjectHistory(
  client: Client,
  projectId: string,
): Promise<ProjectHistoryEntry[]> {
  const { data, error } = await client
    .from('project_history')
    .select('id, operation, changes, changed_at')
    .eq('project_id', projectId)
    .order('changed_at', { ascending: false })
    .order('id', { ascending: false })
  if (error) throw error
  return data.map((row) => {
    if (!isHistoryOperation(row.operation)) throw new Error(`unknown history operation: ${row.operation}`)
    return {
      id: row.id,
      operation: row.operation,
      changedAt: row.changed_at,
      changes: parseHistoryChanges(row.changes),
    }
  })
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
  | { ok: false; reason: 'conflict' | 'not_found' }

type ProjectUpdate = Database['public']['Tables']['projects']['Update']

/**
 * 状態が「画面に表示していた状態(from)」のときだけ更新する。
 * 別の画面で先に状態が変わっていたら conflict を返す。
 * 売上日は、状態の変化に合わせて決める(earnedOnPatch)
 */
async function updateIfStatusIs(
  client: Client,
  id: string,
  change: StatusChange,
  values: ProjectUpdate,
  today: string,
  requestedEarnedOn: string | null = null,
): Promise<UpdateProjectResult> {
  const { data, error } = await client
    .from('projects')
    .update({ ...values, ...earnedOnPatch(change, today, requestedEarnedOn), status: change.to })
    .eq('id', id)
    .eq('status', change.from)
    .select(COLUMNS)
    .maybeSingle()
  if (error) throw error
  if (data) return { ok: true, project: toProject(data) }

  const current = await getProject(client, id)
  return { ok: false, reason: current ? 'conflict' : 'not_found' }
}

/** 項目と状態をまとめて更新する(編集フォーム)。earnedOn は編集画面で指定した売上日 */
export async function updateProject(
  client: Client,
  id: string,
  input: ProjectInput,
  change: StatusChange,
  earnedOn: string | null = null,
  today: string = todayInTokyo(),
): Promise<UpdateProjectResult> {
  return updateIfStatusIs(client, id, change, input, today, earnedOn)
}

/** 状態だけを変える(かんばんのボタン・一覧のプルダウン) */
export async function changeProjectStatus(
  client: Client,
  id: string,
  change: StatusChange,
  today: string = todayInTokyo(),
): Promise<UpdateProjectResult> {
  return updateIfStatusIs(client, id, change, {}, today)
}
