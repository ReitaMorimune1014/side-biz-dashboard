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

const DATES = { issued_on: '2026-10-01', due_on: '2026-10-31' }

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

async function createInvoice(user: TestUser, projectId: string, amount = 100000) {
  const { data, error } = await user.client
    .from('invoices')
    .insert({ project_id: projectId, amount, ...DATES })
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

describe('請求のデータの分離(API を直接呼ぶ)', () => {
  it('本人は、作成・読む・更新・削除ができ、1つの案件に複数の請求を作れる', async () => {
    const first = await createInvoice(alice, aliceProjectId)
    const second = await createInvoice(alice, aliceProjectId, 50000)
    expect(first).toMatchObject({ user_id: alice.userId, paid_on: null })

    const updated = await alice.client
      .from('invoices')
      .update({ paid_on: '2026-10-15' })
      .eq('id', first.id)
      .select('paid_on')
    expect(updated.data).toEqual([{ paid_on: '2026-10-15' }])

    const deleted = await alice.client.from('invoices').delete().eq('id', second.id).select('id')
    expect(deleted.data).toEqual([{ id: second.id }])
  })

  it('B は A の請求を、読む・更新する・削除することができない', async () => {
    const invoice = await createInvoice(alice, aliceProjectId, 7777)

    const read = await bob.client.from('invoices').select().eq('id', invoice.id)
    expect(read.data).toEqual([])

    const updated = await bob.client
      .from('invoices')
      .update({ amount: 1 })
      .eq('id', invoice.id)
      .select()
    expect(updated.data).toEqual([])

    const deleted = await bob.client.from('invoices').delete().eq('id', invoice.id).select()
    expect(deleted.data).toEqual([])

    const { data } = await alice.client.from('invoices').select('amount').eq('id', invoice.id).single()
    expect(data?.amount).toBe(7777)
  })

  it('B は A の案件に請求を付けられない(複合の外部キー)', async () => {
    const { error } = await bob.client
      .from('invoices')
      .insert({ project_id: aliceProjectId, amount: 1, ...DATES })
    expect(error?.code).toBe(FOREIGN_KEY_VIOLATION)
  })

  it('B は自分の請求を、A の案件に付け替えられない', async () => {
    const invoice = await createInvoice(bob, bobProjectId)

    const { error } = await bob.client
      .from('invoices')
      .update({ project_id: aliceProjectId })
      .eq('id', invoice.id)
    expect(error?.code).toBe(FOREIGN_KEY_VIOLATION)
  })

  it('B は所有者を A にした請求を作れない', async () => {
    const { error } = await bob.client
      .from('invoices')
      .insert({ user_id: alice.userId, project_id: bobProjectId, amount: 1, ...DATES })
    expect(error).not.toBeNull()
  })

  it('未ログインでは、読むことも書くこともできない', async () => {
    expect((await anon.from('invoices').select()).error?.code).toBe(INSUFFICIENT_PRIVILEGE)

    const inserted = await anon
      .from('invoices')
      .insert({ project_id: aliceProjectId, amount: 1, ...DATES })
    expect(inserted.error?.code).toBe(INSUFFICIENT_PRIVILEGE)
  })
})

describe('請求の値(DB の check 制約)', () => {
  it.each([
    ['金額が 0', { amount: 0 }],
    ['金額が上限超え', { amount: 1_000_000_000 }],
    ['支払期限が発行日より前', { due_on: '2026-09-30' }],
    ['入金日が発行日より前', { paid_on: '2026-09-30' }],
  ])('%s は拒否する', async (_label, values) => {
    const { error } = await alice.client
      .from('invoices')
      .insert({ project_id: aliceProjectId, amount: 1, ...DATES, ...values })
    expect(error?.code).toBe(CHECK_VIOLATION)
  })

  it('支払期限と入金日は、発行日と同じ日なら受け付ける', async () => {
    const { error } = await alice.client.from('invoices').insert({
      project_id: aliceProjectId,
      amount: 1,
      issued_on: '2026-10-01',
      due_on: '2026-10-01',
      paid_on: '2026-10-01',
    })
    expect(error).toBeNull()
  })
})
