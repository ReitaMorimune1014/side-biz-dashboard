import { beforeAll, describe, expect, it } from 'vitest'
import { createCustomer } from '@/lib/customers/repository'
import {
  changeProjectStatus,
  createProject,
  getProject,
  updateProject,
} from '@/lib/projects/repository'
import type { ProjectInput } from '@/lib/projects/schema'
import { signUpTestUser, type TestUser } from './supabase'

const CHECK_VIOLATION = '23514'
const TODAY = '2026-10-10'

let alice: TestUser
let customerId: string

const input = (): ProjectInput => ({
  customer_id: customerId,
  title: '案件',
  amount: 100000,
  due_date: null,
  memo: null,
})

beforeAll(async () => {
  alice = await signUpTestUser()
  customerId = (await createCustomer(alice.client, { name: 'A社', memo: null })).id
})

describe('売上日(状態の変更に合わせる)', () => {
  it('新しい案件には売上日がない', async () => {
    const project = await createProject(alice.client, input())
    expect(project.earned_on).toBeNull()
  })

  it('納品にすると今日、請求済・入金済では変えず、進行に戻すと消す', async () => {
    const { id } = await createProject(alice.client, input())
    await changeProjectStatus(alice.client, id, { from: 'estimate', to: 'in_progress' }, TODAY)

    await changeProjectStatus(alice.client, id, { from: 'in_progress', to: 'delivered' }, TODAY)
    expect((await getProject(alice.client, id))?.earned_on).toBe(TODAY)

    await changeProjectStatus(alice.client, id, { from: 'delivered', to: 'paid' }, '2026-12-01')
    expect((await getProject(alice.client, id))?.earned_on).toBe(TODAY)

    await changeProjectStatus(alice.client, id, { from: 'paid', to: 'in_progress' }, TODAY)
    expect((await getProject(alice.client, id))?.earned_on).toBeNull()
  })

  it('編集画面では、売上日を指定した日に直せる', async () => {
    const { id } = await createProject(alice.client, input())
    await changeProjectStatus(alice.client, id, { from: 'estimate', to: 'delivered' }, TODAY)

    const result = await updateProject(
      alice.client,
      id,
      input(),
      { from: 'delivered', to: 'delivered' },
      '2026-09-15',
      TODAY,
    )

    expect(result).toMatchObject({ ok: true, project: { earned_on: '2026-09-15' } })
  })

  it('編集画面で売上日を空にしても、納品以降なら元の売上日を残す', async () => {
    const { id } = await createProject(alice.client, input())
    await changeProjectStatus(alice.client, id, { from: 'estimate', to: 'delivered' }, '2026-09-01')

    const result = await updateProject(alice.client, id, input(), { from: 'delivered', to: 'paid' }, null, TODAY)

    expect(result).toMatchObject({ ok: true, project: { status: 'paid', earned_on: '2026-09-01' } })
  })
})

describe('売上日(DB の check 制約)', () => {
  it('納品以降なのに売上日がない状態は拒否する', async () => {
    const { id } = await createProject(alice.client, input())

    const { error } = await alice.client.from('projects').update({ status: 'delivered' }).eq('id', id)
    expect(error?.code).toBe(CHECK_VIOLATION)
  })

  it('納品より前なのに売上日がある状態は拒否する', async () => {
    const { id } = await createProject(alice.client, input())

    const { error } = await alice.client.from('projects').update({ earned_on: TODAY }).eq('id', id)
    expect(error?.code).toBe(CHECK_VIOLATION)
  })
})
