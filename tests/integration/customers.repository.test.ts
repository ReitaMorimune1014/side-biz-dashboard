import { beforeAll, describe, expect, it } from 'vitest'
import {
  createCustomer,
  getActiveCustomer,
  listActiveCustomers,
  softDeleteCustomer,
  updateCustomer,
} from '@/lib/customers/repository'
import { signUpTestUser, type TestUser } from './supabase'

let alice: TestUser
let bob: TestUser

beforeAll(async () => {
  alice = await signUpTestUser()
  bob = await signUpTestUser()
})

describe('論理削除', () => {
  it('論理削除した顧客は、一覧にも1件取得にも出ない', async () => {
    const kept = await createCustomer(alice.client, { name: '残す顧客', memo: null })
    const removed = await createCustomer(alice.client, { name: '消す顧客', memo: 'メモ' })

    expect(await softDeleteCustomer(alice.client, removed.id)).toBe(true)

    const ids = (await listActiveCustomers(alice.client)).map((customer) => customer.id)
    expect(ids).toContain(kept.id)
    expect(ids).not.toContain(removed.id)
    expect(await getActiveCustomer(alice.client, removed.id)).toBeNull()
  })

  it('論理削除した顧客は、更新も再削除もできない', async () => {
    const customer = await createCustomer(alice.client, { name: '消す顧客', memo: null })
    await softDeleteCustomer(alice.client, customer.id)

    expect(await updateCustomer(alice.client, customer.id, { name: '復活', memo: null })).toBeNull()
    expect(await softDeleteCustomer(alice.client, customer.id)).toBe(false)
  })
})

describe('本人の操作', () => {
  it('作成した顧客を、取得・更新できる', async () => {
    const customer = await createCustomer(alice.client, { name: 'A社', memo: null })

    const updated = await updateCustomer(alice.client, customer.id, { name: 'A社(改)', memo: '月末締め' })

    expect(updated).toMatchObject({ id: customer.id, name: 'A社(改)', memo: '月末締め' })
    expect(await getActiveCustomer(alice.client, customer.id)).toMatchObject({ name: 'A社(改)' })
  })

  it('一覧は新しい順に並ぶ', async () => {
    const first = await createCustomer(alice.client, { name: '先に作成', memo: null })
    const second = await createCustomer(alice.client, { name: '後に作成', memo: null })

    const ids = (await listActiveCustomers(alice.client)).map((customer) => customer.id)
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id))
  })
})

describe('他人(B)は A の顧客を操作できない', () => {
  it('取得・更新・論理削除のどれも「見つからない」になり、A の顧客は変わらない', async () => {
    const customer = await createCustomer(alice.client, { name: 'Aの顧客', memo: null })

    expect(await getActiveCustomer(bob.client, customer.id)).toBeNull()
    expect(await updateCustomer(bob.client, customer.id, { name: '乗っ取り', memo: null })).toBeNull()
    expect(await softDeleteCustomer(bob.client, customer.id)).toBe(false)
    expect((await listActiveCustomers(bob.client)).map((c) => c.id)).not.toContain(customer.id)

    expect(await getActiveCustomer(alice.client, customer.id)).toMatchObject({ name: 'Aの顧客' })
  })
})
