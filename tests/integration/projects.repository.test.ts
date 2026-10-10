import { beforeAll, describe, expect, it } from 'vitest'
import { createCustomer, softDeleteCustomer } from '@/lib/customers/repository'
import {
  changeProjectStatus,
  createProject,
  getProject,
  listProjects,
  updateProject,
} from '@/lib/projects/repository'
import type { ProjectInput } from '@/lib/projects/schema'
import { signUpTestUser, type TestUser } from './supabase'

let alice: TestUser
let bob: TestUser
let customerId: string

const input = (overrides: Partial<ProjectInput> = {}): ProjectInput => ({
  customer_id: customerId,
  title: 'LP制作',
  amount: 120000,
  due_date: '2026-10-31',
  memo: null,
  ...overrides,
})

beforeAll(async () => {
  alice = await signUpTestUser()
  bob = await signUpTestUser()
  customerId = (await createCustomer(alice.client, { name: 'A社', memo: null })).id
})

describe('updateProject', () => {
  it('項目と状態をまとめて更新できる', async () => {
    const project = await createProject(alice.client, input())

    const result = await updateProject(alice.client, project.id, input({ title: '改題' }), {
      from: 'estimate',
      to: 'ordered',
    })

    expect(result).toMatchObject({ ok: true, project: { title: '改題', status: 'ordered' } })
  })

  it('飛び越した状態にも変更できる', async () => {
    const project = await createProject(alice.client, input())

    const result = await updateProject(alice.client, project.id, input(), {
      from: 'estimate',
      to: 'paid',
    })

    expect(result).toMatchObject({ ok: true, project: { status: 'paid' } })
  })

  it('フォームを開いた後に、別の画面で状態が変わっていたら conflict にする', async () => {
    const project = await createProject(alice.client, input())
    // 別のタブで、先に受注にした
    await updateProject(alice.client, project.id, input(), { from: 'estimate', to: 'ordered' })

    // 古い画面(見積のつもり)から失注にしようとする
    const result = await updateProject(alice.client, project.id, input(), {
      from: 'estimate',
      to: 'lost',
    })

    expect(result).toEqual({ ok: false, reason: 'conflict' })
    expect((await getProject(alice.client, project.id))?.status).toBe('ordered')
  })

  it('他人の案件は not_found になり、変わらない', async () => {
    const project = await createProject(alice.client, input({ title: 'Aの案件' }))

    const result = await updateProject(bob.client, project.id, input({ title: '乗っ取り' }), {
      from: 'estimate',
      to: 'estimate',
    })

    expect(result).toEqual({ ok: false, reason: 'not_found' })
    expect((await getProject(alice.client, project.id))?.title).toBe('Aの案件')
  })
})

describe('changeProjectStatus(かんばんのボタン・一覧のプルダウン)', () => {
  it('状態だけを変え、ほかの項目は変えない', async () => {
    const project = await createProject(alice.client, input({ title: 'そのまま', amount: 5000 }))

    const result = await changeProjectStatus(alice.client, project.id, {
      from: 'estimate',
      to: 'ordered',
    })

    expect(result).toMatchObject({
      ok: true,
      project: { status: 'ordered', title: 'そのまま', amount: 5000 },
    })
  })

  it('失注から進行のように、どの状態へも変更できる', async () => {
    const project = await createProject(alice.client, input())
    await changeProjectStatus(alice.client, project.id, { from: 'estimate', to: 'lost' })

    const result = await changeProjectStatus(alice.client, project.id, {
      from: 'lost',
      to: 'in_progress',
    })

    expect(result).toMatchObject({ ok: true, project: { status: 'in_progress' } })
  })

  it('画面に表示していた状態が古ければ conflict にし、状態を変えない', async () => {
    const project = await createProject(alice.client, input())
    await changeProjectStatus(alice.client, project.id, { from: 'estimate', to: 'ordered' })

    // 別のタブには、まだ「見積」の列に表示されている
    const result = await changeProjectStatus(alice.client, project.id, {
      from: 'estimate',
      to: 'lost',
    })

    expect(result).toEqual({ ok: false, reason: 'conflict' })
    expect((await getProject(alice.client, project.id))?.status).toBe('ordered')
  })

  it('他人の案件は not_found になり、変わらない', async () => {
    const project = await createProject(alice.client, input())

    const result = await changeProjectStatus(bob.client, project.id, {
      from: 'estimate',
      to: 'lost',
    })

    expect(result).toEqual({ ok: false, reason: 'not_found' })
    expect((await getProject(alice.client, project.id))?.status).toBe('estimate')
  })
})

describe('listProjects', () => {
  it('顧客名を付けて返し、論理削除した顧客の案件には印を付ける', async () => {
    const removedCustomer = await createCustomer(alice.client, { name: '取引終了', memo: null })
    const project = await createProject(alice.client, input({ customer_id: removedCustomer.id }))
    await softDeleteCustomer(alice.client, removedCustomer.id)

    const listed = (await listProjects(alice.client)).find((p) => p.id === project.id)

    expect(listed?.customer).toEqual({ name: '取引終了', deleted: true })
  })

  it('他人の案件は含まれない', async () => {
    const project = await createProject(alice.client, input())

    const ids = (await listProjects(bob.client)).map((p) => p.id)
    expect(ids).not.toContain(project.id)
  })
})
