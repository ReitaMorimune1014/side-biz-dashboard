import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { isWeekday } from '@/lib/weekly/week'
import { DEFAULT_SETTINGS, type Settings } from './schema'

type Client = SupabaseClient<Database>

// 所有者の絞り込みは RLS が行う。ここでは user_id を扱わない

/** まだ保存していなければ、既定値(週5時間・月曜始まり)を返す */
export async function getSettings(client: Client): Promise<Settings> {
  const { data, error } = await client
    .from('user_settings')
    .select('weekly_target_minutes, week_start')
    .maybeSingle()
  if (error) throw error
  if (!data) return DEFAULT_SETTINGS
  if (!isWeekday(data.week_start)) throw new Error(`unknown week_start: ${data.week_start}`)
  return { weekly_target_minutes: data.weekly_target_minutes, week_start: data.week_start }
}

/** 初回は作成し、2回目からは更新する(user_id は DB の既定値 auth.uid() が入る) */
export async function saveSettings(client: Client, settings: Settings): Promise<void> {
  const { error } = await client.from('user_settings').upsert(settings, { onConflict: 'user_id' })
  if (error) throw error
}
