import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createAnonClient, signUpTestUser, type TestUser } from './supabase'

// RLS の違反と、権限(grant)がないときの両方で返る、Postgres の insufficient_privilege
const INSUFFICIENT_PRIVILEGE = '42501'

type Customer = {
  id: string
  user_id: string
  name: string
  memo: string | null
  deleted_at: string | null
}

let alice: TestUser
let bob: TestUser
let anon: SupabaseClient

beforeAll(async () => {
  alice = await signUpTestUser()
  bob = await signUpTestUser()
  anon = createAnonClient()
})

async function createCustomer(user: TestUser, name: string): Promise<Customer> {
  const { data, error } = await user.client.from('customers').insert({ name }).select().single()
  if (error) throw error
  return data
}

async function readAs(user: TestUser, id: string): Promise<Customer | null> {
  const { data, error } = await user.client.from('customers').select().eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

describe('本人は自分の行を操作できる', () => {
  it('user_id を指定せずに追加すると、本人の ID が入る', async () => {
    const customer = await createCustomer(alice, 'A社')

    expect(customer.user_id).toBe(alice.userId)
  })

  it('読む・変更・論理削除・削除ができる', async () => {
    const customer = await createCustomer(alice, 'A社')

    expect(await readAs(alice, customer.id)).not.toBeNull()

    const updated = await alice.client
      .from('customers')
      .update({ name: 'A社(改)' })
      .eq('id', customer.id)
      .select()
    expect(updated.error).toBeNull()
    expect(updated.data).toHaveLength(1)

    const softDeleted = await alice.client
      .from('customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', customer.id)
      .select()
    expect(softDeleted.error).toBeNull()
    expect(softDeleted.data?.[0].deleted_at).not.toBeNull()

    const deleted = await alice.client.from('customers').delete().eq('id', customer.id).select()
    expect(deleted.error).toBeNull()
    expect(deleted.data).toHaveLength(1)
    expect(await readAs(alice, customer.id)).toBeNull()
  })
})

describe('他人(B)は A の行を操作できない', () => {
  let target: Customer

  beforeEach(async () => {
    target = await createCustomer(alice, 'Aの顧客')
  })

  it('id を指定しても読めない', async () => {
    expect(await readAs(bob, target.id)).toBeNull()
  })

  it('一覧に A の行が含まれない', async () => {
    const { data, error } = await bob.client.from('customers').select()

    expect(error).toBeNull()
    expect(data?.map((row) => row.user_id)).not.toContain(alice.userId)
  })

  it('名前を変更できない', async () => {
    const { data, error } = await bob.client
      .from('customers')
      .update({ name: '乗っ取り' })
      .eq('id', target.id)
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(0)
    expect((await readAs(alice, target.id))?.name).toBe('Aの顧客')
  })

  it('論理削除できない', async () => {
    const { data, error } = await bob.client
      .from('customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', target.id)
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(0)
    expect((await readAs(alice, target.id))?.deleted_at).toBeNull()
  })

  it('削除できない', async () => {
    const { data, error } = await bob.client.from('customers').delete().eq('id', target.id).select()

    expect(error).toBeNull()
    expect(data).toHaveLength(0)
    expect(await readAs(alice, target.id)).not.toBeNull()
  })

  it('A の user_id を指定して追加できない', async () => {
    const { error } = await bob.client
      .from('customers')
      .insert({ name: 'なりすまし', user_id: alice.userId })

    expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
  })

  it('自分の行の user_id を A に書き換えられない', async () => {
    const own = await createCustomer(bob, 'Bの顧客')

    const { error } = await bob.client
      .from('customers')
      .update({ user_id: alice.userId })
      .eq('id', own.id)

    expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
    expect((await readAs(bob, own.id))?.user_id).toBe(bob.userId)
  })
})

describe('未ログインでは操作できない', () => {
  it('読めない', async () => {
    const { error } = await anon.from('customers').select()

    expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
  })

  it('追加できない', async () => {
    const { error } = await anon.from('customers').insert({ name: '匿名' })

    expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
  })
})
