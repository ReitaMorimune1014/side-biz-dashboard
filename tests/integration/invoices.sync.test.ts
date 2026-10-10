import { beforeAll, describe, expect, it } from 'vitest'
import { createCustomer } from '@/lib/customers/repository'
import {
  createInvoice,
  deleteInvoice,
  setInvoicePaidOn,
} from '@/lib/invoices/repository'
import { syncProjectStatus } from '@/lib/invoices/sync'
import { changeProjectStatus, createProject, getProject } from '@/lib/projects/repository'
import type { ProjectStatus } from '@/lib/projects/status'
import { signUpTestUser, type TestUser } from './supabase'

let alice: TestUser
let customerId: string

async function projectIn(status: ProjectStatus) {
  const project = await createProject(alice.client, {
    customer_id: customerId,
    title: '案件',
    amount: 100000,
    due_date: null,
    memo: null,
  })
  if (status !== 'estimate') {
    await changeProjectStatus(alice.client, project.id, { from: 'estimate', to: status })
  }
  return project.id
}

const invoice = (projectId: string) =>
  createInvoice(alice.client, {
    project_id: projectId,
    amount: 50000,
    issued_on: '2026-10-01',
    due_on: '2026-10-31',
    paid_on: null,
  })

async function statusAfterSync(projectId: string) {
  await syncProjectStatus(alice.client, projectId)
  return (await getProject(alice.client, projectId))?.status
}

beforeAll(async () => {
  alice = await signUpTestUser()
  customerId = (await createCustomer(alice.client, { name: 'A社', memo: null })).id
})

describe('syncProjectStatus(請求と案件の状態の連動)', () => {
  it('納品の案件: 請求を作ると請求済、すべて入金で入金済、戻すと請求済、消すと納品', async () => {
    const projectId = await projectIn('delivered')

    const first = await invoice(projectId)
    expect(await statusAfterSync(projectId)).toBe('invoiced')

    const second = await invoice(projectId)
    await setInvoicePaidOn(alice.client, first.id, '2026-10-10')
    expect(await statusAfterSync(projectId)).toBe('invoiced') // 2つ目が未入金

    await setInvoicePaidOn(alice.client, second.id, '2026-10-11')
    expect(await statusAfterSync(projectId)).toBe('paid')

    await setInvoicePaidOn(alice.client, second.id, null)
    expect(await statusAfterSync(projectId)).toBe('invoiced')

    await deleteInvoice(alice.client, first.id)
    await deleteInvoice(alice.client, second.id)
    expect(await statusAfterSync(projectId)).toBe('delivered')
  })

  it('進行中の案件は、着手金の請求を作っても入金しても変えない', async () => {
    const projectId = await projectIn('in_progress')

    const deposit = await invoice(projectId)
    expect(await statusAfterSync(projectId)).toBe('in_progress')

    await setInvoicePaidOn(alice.client, deposit.id, '2026-10-10')
    expect(await statusAfterSync(projectId)).toBe('in_progress')
  })

  it('失注の案件は変えない', async () => {
    const projectId = await projectIn('lost')
    await invoice(projectId)

    expect(await statusAfterSync(projectId)).toBe('lost')
  })

  it('他人の案件は、見つからないので何もしない', async () => {
    const projectId = await projectIn('delivered')
    await invoice(projectId)
    const bob = await signUpTestUser()

    await syncProjectStatus(bob.client, projectId)
    expect((await getProject(alice.client, projectId))?.status).toBe('delivered')
  })
})
