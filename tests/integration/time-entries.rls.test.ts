import { beforeAll, describe, expect, it } from 'vitest'
import { createAnonClient, signUpTestUser, type TestClient, type TestUser } from './supabase'

const INSUFFICIENT_PRIVILEGE = '42501'
const FOREIGN_KEY_VIOLATION = '23503'
const CHECK_VIOLATION = '23514'

let alice: TestUser
let bob: TestUser
let anon: TestClient
let aliceProjectId: string
let bobProjectId: string

async function createProject(user: TestUser) {
  const customer = await user.client.from('customers').insert({ name: '顧客' }).select('id').single()
  if (customer.error) throw customer.error
  const project = await user.client
    .from('projects')
    .insert({ customer_id: customer.data.id, title: '案件', amount: 1 })
    .select('id')
    .single()
  if (project.error) throw project.error
  return project.data.id
}

async function createEntry(user: TestUser, projectId: string, minutes = 60) {
  const { data, error } = await user.client
    .from('time_entries')
    .insert({ project_id: projectId, work_date: '2026-10-09', minutes })
    .select()
    .single()
  if (error) throw error
  return data
}

beforeAll(async () => {
  alice = await signUpTestUser()
  bob = await signUpTestUser()
  anon = createAnonClient()
  aliceProjectId = await createProject(alice)
  bobProjectId = await createProject(bob)
})

describe('稼働のデータの分離(API を直接呼ぶ)', () => {
  it('本人は、作成・読む・更新・削除ができる', async () => {
    const entry = await createEntry(alice, aliceProjectId)
    expect(entry).toMatchObject({ user_id: alice.userId, minutes: 60 })

    const updated = await alice.client
      .from('time_entries')
      .update({ minutes: 90 })
      .eq('id', entry.id)
      .select('minutes')
    expect(updated.error).toBeNull()
    expect(updated.data).toEqual([{ minutes: 90 }])

    const deleted = await alice.client.from('time_entries').delete().eq('id', entry.id).select('id')
    expect(deleted.error).toBeNull()
    expect(deleted.data).toEqual([{ id: entry.id }])
  })

  it('B は A の稼働を、読む・更新する・削除することができない', async () => {
    const entry = await createEntry(alice, aliceProjectId, 30)

    const read = await bob.client.from('time_entries').select().eq('id', entry.id)
    expect(read.data).toEqual([])

    const updated = await bob.client
      .from('time_entries')
      .update({ minutes: 999 })
      .eq('id', entry.id)
      .select()
    expect(updated.data).toEqual([])

    const deleted = await bob.client.from('time_entries').delete().eq('id', entry.id).select()
    expect(deleted.data).toEqual([])

    const { data } = await alice.client
      .from('time_entries')
      .select('minutes')
      .eq('id', entry.id)
      .single()
    expect(data?.minutes).toBe(30)
  })

  it('B は A の案件に稼働を付けられない(複合の外部キー)', async () => {
    const { error } = await bob.client
      .from('time_entries')
      .insert({ project_id: aliceProjectId, work_date: '2026-10-09', minutes: 60 })
    expect(error?.code).toBe(FOREIGN_KEY_VIOLATION)
  })

  it('B は自分の稼働を、A の案件に付け替えられない', async () => {
    const entry = await createEntry(bob, bobProjectId)

    const { error } = await bob.client
      .from('time_entries')
      .update({ project_id: aliceProjectId })
      .eq('id', entry.id)
    expect(error?.code).toBe(FOREIGN_KEY_VIOLATION)
  })

  it('B は所有者を A にした稼働を作れない', async () => {
    const { error } = await bob.client
      .from('time_entries')
      .insert({ user_id: alice.userId, project_id: bobProjectId, work_date: '2026-10-09', minutes: 1 })
    expect(error).not.toBeNull()
  })

  it('未ログインでは、読むことも書くこともできない', async () => {
    const read = await anon.from('time_entries').select()
    expect(read.error?.code).toBe(INSUFFICIENT_PRIVILEGE)

    const inserted = await anon
      .from('time_entries')
      .insert({ project_id: aliceProjectId, work_date: '2026-10-09', minutes: 1 })
    expect(inserted.error?.code).toBe(INSUFFICIENT_PRIVILEGE)
  })
})

describe('稼働の値(DB の check 制約)', () => {
  it.each([0, -1, 1441])('%i 分は拒否する', async (minutes) => {
    const { error } = await alice.client
      .from('time_entries')
      .insert({ project_id: aliceProjectId, work_date: '2026-10-09', minutes })
    expect(error?.code).toBe(CHECK_VIOLATION)
  })

  it('1分と1440分は受け付ける', async () => {
    expect((await createEntry(alice, aliceProjectId, 1)).minutes).toBe(1)
    expect((await createEntry(alice, aliceProjectId, 1440)).minutes).toBe(1440)
  })
})
