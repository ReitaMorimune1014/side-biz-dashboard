import { beforeAll, describe, expect, it } from 'vitest'
import { getCustomerNames } from '@/lib/customers/repository'
import { historyCustomerIds } from '@/lib/projects/history'
import { changeProjectStatus, listProjectHistory } from '@/lib/projects/repository'
import { markReadOnly } from './local-db'
import { createAnonClient, signUpTestUser, type TestClient, type TestUser } from './supabase'

const INSUFFICIENT_PRIVILEGE = '42501'

let alice: TestUser
let bob: TestUser
let anon: TestClient
let customerId: string

async function createProject(user: TestUser, title = '案件') {
  const { data, error } = await user.client
    .from('projects')
    .insert({ customer_id: customerId, title, amount: 1000 })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

async function historyOf(client: TestClient, projectId: string) {
  const { data, error } = await client
    .from('project_history')
    .select('operation, changes, user_id')
    .eq('project_id', projectId)
    .order('id')
  if (error) throw error
  return data
}

beforeAll(async () => {
  alice = await signUpTestUser()
  bob = await signUpTestUser()
  anon = createAnonClient()
  const customer = await alice.client.from('customers').insert({ name: '顧客' }).select('id').single()
  if (customer.error) throw customer.error
  customerId = customer.data.id
})

describe('案件の変更履歴(DB のトリガー)', () => {
  it('作成すると、値の入った項目を記録する', async () => {
    const id = await createProject(alice, 'ロゴ制作')

    expect(await historyOf(alice.client, id)).toEqual([
      {
        operation: 'create',
        user_id: alice.userId,
        changes: {
          customer_id: { before: null, after: customerId },
          title: { before: null, after: 'ロゴ制作' },
          amount: { before: null, after: 1000 },
          status: { before: null, after: 'estimate' },
        },
      },
    ])
  })

  it('変更すると、変わった項目だけを、変更前と変更後で記録する', async () => {
    const id = await createProject(alice)

    const { error } = await alice.client
      .from('projects')
      .update({ title: '新しい題名', amount: 2000, memo: 'メモ' })
      .eq('id', id)
    expect(error).toBeNull()

    const history = await historyOf(alice.client, id)
    expect(history).toHaveLength(2)
    expect(history[1]).toEqual({
      operation: 'update',
      user_id: alice.userId,
      changes: {
        title: { before: '案件', after: '新しい題名' },
        amount: { before: 1000, after: 2000 },
        memo: { before: null, after: 'メモ' },
      },
    })
  })

  it('状態と売上日の変更も記録する', async () => {
    const id = await createProject(alice)

    await alice.client
      .from('projects')
      .update({ status: 'delivered', earned_on: '2026-10-09' })
      .eq('id', id)

    expect((await historyOf(alice.client, id))[1].changes).toEqual({
      status: { before: 'estimate', after: 'delivered' },
      earned_on: { before: null, after: '2026-10-09' },
    })
  })

  it('値が同じままの更新は、記録しない', async () => {
    const id = await createProject(alice)

    await alice.client.from('projects').update({ title: '案件' }).eq('id', id)

    expect(await historyOf(alice.client, id)).toHaveLength(1)
  })

  it('本人も、履歴を追加・変更・削除できない', async () => {
    const id = await createProject(alice)

    const inserted = await alice.client.from('project_history').insert({
      project_id: id,
      user_id: alice.userId,
      operation: 'update',
      changes: { title: { before: 'a', after: 'b' } },
    })
    expect(inserted.error?.code).toBe(INSUFFICIENT_PRIVILEGE)

    const updated = await alice.client
      .from('project_history')
      .update({ changes: {} })
      .eq('project_id', id)
    expect(updated.error?.code).toBe(INSUFFICIENT_PRIVILEGE)

    const deleted = await alice.client.from('project_history').delete().eq('project_id', id)
    expect(deleted.error?.code).toBe(INSUFFICIENT_PRIVILEGE)

    expect(await historyOf(alice.client, id)).toHaveLength(1)
  })

  it('他人の履歴は見えない。未ログインでは読めない', async () => {
    const id = await createProject(alice)

    expect(await historyOf(bob.client, id)).toEqual([])

    const read = await anon.from('project_history').select()
    expect(read.error?.code).toBe(INSUFFICIENT_PRIVILEGE)
  })

  it('記録の関数は、API から直接呼べない', async () => {
    const { error } = await alice.client.rpc('record_project_history' as never)
    expect(error).not.toBeNull()
  })
})

describe('listProjectHistory と getCustomerNames(アプリの読み出し)', () => {
  it('アプリの操作で付いた履歴を、新しい順に返す。削除した顧客の名前も引ける', async () => {
    const id = await createProject(alice, '一覧用')
    const other = await alice.client.from('customers').insert({ name: '別の顧客' }).select('id').single()
    if (other.error) throw other.error

    await changeProjectStatus(alice.client, id, { from: 'estimate', to: 'ordered' })
    await alice.client.from('projects').update({ customer_id: other.data.id }).eq('id', id)
    await alice.client.from('customers').update({ deleted_at: new Date().toISOString() }).eq('id', other.data.id)

    const history = await listProjectHistory(alice.client, id)
    expect(history.map((h) => h.operation)).toEqual(['update', 'update', 'create'])
    expect(history[0].changes).toEqual({
      customer_id: { before: customerId, after: other.data.id },
    })
    expect(history[1].changes.status).toEqual({ before: 'estimate', after: 'ordered' })

    const names = await getCustomerNames(alice.client, historyCustomerIds(history))
    expect(names.get(customerId)).toEqual({ name: '顧客', deleted: false })
    expect(names.get(other.data.id)).toEqual({ name: '別の顧客', deleted: true })
  })

  it('他人の案件の履歴は、空で返る', async () => {
    const id = await createProject(alice)
    expect(await listProjectHistory(bob.client, id)).toEqual([])
  })
})

describe('閲覧専用のアカウントと変更履歴', () => {
  it('自分の案件の履歴を読める', async () => {
    const viewer = await signUpTestUser()
    const customer = await viewer.client.from('customers').insert({ name: '顧客' }).select('id').single()
    if (customer.error) throw customer.error
    const project = await viewer.client
      .from('projects')
      .insert({ customer_id: customer.data.id, title: 'デモ', amount: 1 })
      .select('id')
      .single()
    if (project.error) throw project.error

    await markReadOnly(viewer.userId)
    await viewer.client.auth.refreshSession()

    expect(await historyOf(viewer.client, project.data.id)).toHaveLength(1)
  })
})
