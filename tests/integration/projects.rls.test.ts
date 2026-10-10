import { beforeAll, describe, expect, it } from 'vitest'
import { createAnonClient, signUpTestUser, type TestClient, type TestUser } from './supabase'

const INSUFFICIENT_PRIVILEGE = '42501'
const FOREIGN_KEY_VIOLATION = '23503'
const CHECK_VIOLATION = '23514'

let alice: TestUser
let bob: TestUser
let anon: TestClient
let aliceCustomerId: string
let bobCustomerId: string

async function createCustomer(user: TestUser, name: string) {
  const { data, error } = await user.client.from('customers').insert({ name }).select('id').single()
  if (error) throw error
  return data.id
}

async function createProject(user: TestUser, customerId: string, title = '案件') {
  const { data, error } = await user.client
    .from('projects')
    .insert({ customer_id: customerId, title, amount: 100000 })
    .select()
    .single()
  if (error) throw error
  return data
}

/** 納品以降には売上日が要る(projects_earned_on_matches_status) */
async function setStatus(user: TestUser, id: string, status: string) {
  const earned_on = ['delivered', 'invoiced', 'paid'].includes(status) ? '2026-10-10' : null
  return user.client.from('projects').update({ status, earned_on }).eq('id', id).select('status')
}

beforeAll(async () => {
  alice = await signUpTestUser()
  bob = await signUpTestUser()
  anon = createAnonClient()
  aliceCustomerId = await createCustomer(alice, 'Aの顧客')
  bobCustomerId = await createCustomer(bob, 'Bの顧客')
})

describe('データの分離(API を直接呼ぶ)', () => {
  it('本人は案件を作成・読む・更新でき、状態は見積から始まる', async () => {
    const project = await createProject(alice, aliceCustomerId)
    expect(project).toMatchObject({ user_id: alice.userId, status: 'estimate' })

    const { data, error } = await alice.client
      .from('projects')
      .update({ title: '改題' })
      .eq('id', project.id)
      .select('title')
    expect(error).toBeNull()
    expect(data).toEqual([{ title: '改題' }])
  })

  it('B は A の案件を、読む・更新することができない', async () => {
    const project = await createProject(alice, aliceCustomerId, 'Aの案件')

    const read = await bob.client.from('projects').select().eq('id', project.id)
    expect(read.data).toEqual([])

    const updated = await bob.client
      .from('projects')
      .update({ title: '乗っ取り' })
      .eq('id', project.id)
      .select()
    expect(updated.data).toEqual([])

    const { data } = await alice.client.from('projects').select('title').eq('id', project.id).single()
    expect(data?.title).toBe('Aの案件')
  })

  it('B は A の顧客を指定して案件を作れない(複合の外部キー)', async () => {
    const { error } = await bob.client
      .from('projects')
      .insert({ customer_id: aliceCustomerId, title: '他人の顧客', amount: 1 })
    expect(error?.code).toBe(FOREIGN_KEY_VIOLATION)
  })

  it('B は自分の案件の顧客を、A の顧客に付け替えられない', async () => {
    const project = await createProject(bob, bobCustomerId)

    const { error } = await bob.client
      .from('projects')
      .update({ customer_id: aliceCustomerId })
      .eq('id', project.id)
    expect(error?.code).toBe(FOREIGN_KEY_VIOLATION)
  })

  it('本人も含めて、案件は削除できない', async () => {
    const project = await createProject(alice, aliceCustomerId)

    const { error } = await alice.client.from('projects').delete().eq('id', project.id)
    expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
  })

  it('未ログインでは読めない', async () => {
    const { error } = await anon.from('projects').select()
    expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
  })
})

describe('状態(DB のトリガーと check 制約)', () => {
  it('見積以外の状態で作成できない', async () => {
    const { error } = await alice.client
      .from('projects')
      .insert({ customer_id: aliceCustomerId, title: '途中から', amount: 1, status: 'in_progress' })
    expect(error?.code).toBe(CHECK_VIOLATION)
  })

  it('どの状態からどの状態へも、一度に変更できる', async () => {
    const project = await createProject(alice, aliceCustomerId)

    // 飛び越し・大きく戻す・進行から失注・失注から進行を含む
    for (const status of ['paid', 'estimate', 'in_progress', 'lost', 'delivered', 'ordered']) {
      const { data, error } = await setStatus(alice, project.id, status)
      expect(error).toBeNull()
      expect(data).toEqual([{ status }])
    }
  })

  it('一覧にない状態は拒否する', async () => {
    const project = await createProject(alice, aliceCustomerId)

    const { error } = await setStatus(alice, project.id, 'cancelled')
    expect(error?.code).toBe(CHECK_VIOLATION)
  })
})
