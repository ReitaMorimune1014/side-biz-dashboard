import type { SupabaseClient } from '@supabase/supabase-js'
import { changeProjectStatus, getProject } from '@/lib/projects/repository'
import type { Database } from '@/lib/supabase/database.types'
import { projectStatusFromInvoices } from './project-status'
import { listProjectInvoicePayments } from './repository'

type Client = SupabaseClient<Database>

/**
 * 請求を変えた後に、案件の状態を請求に合わせる。
 * 読んだ後に別の画面で状態が変わっていたら(conflict)、そちらを優先して何もしない
 */
export async function syncProjectStatus(client: Client, projectId: string): Promise<void> {
  const project = await getProject(client, projectId)
  if (!project) return

  const next = projectStatusFromInvoices(
    project.status,
    await listProjectInvoicePayments(client, projectId),
  )
  if (next === project.status) return

  await changeProjectStatus(client, projectId, { from: project.status, to: next })
}
