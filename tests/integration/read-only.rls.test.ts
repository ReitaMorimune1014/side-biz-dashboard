import { beforeAll, describe, expect, it } from 'vitest'
import { markReadOnly } from './local-db'
import { createAnonClient, signUpTestUser, type TestUser } from './supabase'

const INSUFFICIENT_PRIVILEGE = '42501'

let demo: TestUser
let normal: TestUser
let customerId: string
let projectId: string
let entryId: string

beforeAll(async () => {
  demo = await signUpTestUser()
  normal = await signUpTestUser()

  // 閲覧専用にする前に、本人のデータを作っておく
  const customer = await demo.client.from('customers').insert({ name: 'デモ顧客' }).select('id').single()
  if (customer.error) throw customer.error
  customerId = customer.data.id
  const project = await demo.client
    .from('projects')
    .insert({ customer_id: customerId, title: 'デモ案件', amount: 1000 })
    .select('id')
    .single()
  if (project.error) throw project.error
  projectId = project.data.id
  const entry = await demo.client
    .from('time_entries')
    .insert({ project_id: projectId, work_date: '2026-10-09', minutes: 60 })
    .select('id')
    .single()
  if (entry.error) throw entry.error
  entryId = entry.data.id
  const settings = await demo.client.from('user_settings').insert({ weekly_target_minutes: 300 })
  if (settings.error) throw settings.error

  await markReadOnly(demo.userId)
  const refreshed = await demo.client.auth.refreshSession()
  if (refreshed.error) throw refreshed.error
})

describe('閲覧専用のアカウント(API を直接呼ぶ)', () => {
  it('閲覧専用のフラグが JWT に入り、DB でも判定できる', async () => {
    const { data: claims } = await demo.client.auth.getClaims()
    expect(claims?.claims.app_metadata?.read_only).toBe(true)

    expect((await demo.client.rpc('is_read_only')).data).toBe(true)
    expect((await normal.client.rpc('is_read_only')).data).toBe(false)
  })

  it('自分のデータは読める', async () => {
    expect((await demo.client.from('customers').select('id')).data).toEqual([{ id: customerId }])
    expect((await demo.client.from('projects').select('id')).data).toEqual([{ id: projectId }])
    expect((await demo.client.from('time_entries').select('id')).data).toEqual([{ id: entryId }])
    expect((await demo.client.from('user_settings').select('weekly_target_minutes')).data).toEqual([
      { weekly_target_minutes: 300 },
    ])
  })

  it('追加できない', async () => {
    const customer = await demo.client.from('customers').insert({ name: '追加' })
    expect(customer.error?.code).toBe(INSUFFICIENT_PRIVILEGE)

    const project = await demo.client
      .from('projects')
      .insert({ customer_id: customerId, title: '追加', amount: 1 })
    expect(project.error?.code).toBe(INSUFFICIENT_PRIVILEGE)

    const entry = await demo.client
      .from('time_entries')
      .insert({ project_id: projectId, work_date: '2026-10-09', minutes: 1 })
    expect(entry.error?.code).toBe(INSUFFICIENT_PRIVILEGE)
  })

  it('更新できない(対象の行が見つからない扱いになる)', async () => {
    const customer = await demo.client.from('customers').update({ name: '変更' }).eq('id', customerId).select()
    expect(customer.data).toEqual([])

    const project = await demo.client
      .from('projects')
      .update({ status: 'ordered' })
      .eq('id', projectId)
      .select()
    expect(project.data).toEqual([])

    const entry = await demo.client.from('time_entries').update({ minutes: 999 }).eq('id', entryId).select()
    expect(entry.data).toEqual([])

    const settings = await demo.client
      .from('user_settings')
      .update({ weekly_target_minutes: 1 })
      .eq('user_id', demo.userId)
      .select()
    expect(settings.data).toEqual([])

    const { data } = await demo.client.from('customers').select('name').eq('id', customerId).single()
    expect(data?.name).toBe('デモ顧客')
  })

  it('削除できない', async () => {
    const entry = await demo.client.from('time_entries').delete().eq('id', entryId).select()
    expect(entry.data).toEqual([])

    const customer = await demo.client.from('customers').delete().eq('id', customerId).select()
    expect(customer.data).toEqual([])

    expect((await demo.client.from('time_entries').select('id')).data).toEqual([{ id: entryId }])
  })

  it('upsert でも設定を書き換えられない', async () => {
    const { error } = await demo.client
      .from('user_settings')
      .upsert({ user_id: demo.userId, weekly_target_minutes: 1 })
    expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
  })

  it('閲覧専用でないユーザーは、これまでどおり書き込める', async () => {
    const { error } = await normal.client.from('customers').insert({ name: '通常' })
    expect(error).toBeNull()
  })
})

describe('閲覧専用のアカウントのログイン情報(共有するデモの乗っ取り防止)', () => {
  it('パスワードを変えられない', async () => {
    const { error } = await demo.client.auth.updateUser({ password: crypto.randomUUID() })
    expect(error).not.toBeNull()
  })

  it('メールアドレスを変えられない', async () => {
    const { error } = await demo.client.auth.updateUser({ email: `changed-${crypto.randomUUID()}@example.com` })
    expect(error).not.toBeNull()
  })

  it('元のパスワードで、これまでどおりログインできる', async () => {
    const client = createAnonClient()
    const { data, error } = await client.auth.signInWithPassword({ email: demo.email, password: demo.password })
    expect(error).toBeNull()
    expect(data.user?.app_metadata.read_only).toBe(true)
  })

  it('閲覧専用でないユーザーは、パスワードを変えられる', async () => {
    const { error } = await normal.client.auth.updateUser({ password: crypto.randomUUID() })
    expect(error).toBeNull()
  })
})
