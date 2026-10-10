import { beforeAll, describe, expect, it } from 'vitest'
import { createCustomer } from '@/lib/customers/repository'
import {
  createInvoice,
  deleteInvoice,
  getInvoice,
  listInvoices,
  setInvoicePaidOn,
  updateInvoice,
} from '@/lib/invoices/repository'
import type { InvoiceInput } from '@/lib/invoices/schema'
import { createProject } from '@/lib/projects/repository'
import { signUpTestUser, type TestUser } from './supabase'

let alice: TestUser
let bob: TestUser
let projectId: string

const input = (overrides: Partial<InvoiceInput> = {}): InvoiceInput => ({
  project_id: projectId,
  amount: 120000,
  issued_on: '2026-10-01',
  due_on: '2026-10-31',
  paid_on: null,
  ...overrides,
})

beforeAll(async () => {
  alice = await signUpTestUser()
  bob = await signUpTestUser()
  const customer = await createCustomer(alice.client, { name: 'A社', memo: null })
  const project = await createProject(alice.client, {
    customer_id: customer.id,
    title: 'LP制作',
    amount: 120000,
    due_date: null,
    memo: null,
  })
  projectId = project.id
})

describe('listInvoices', () => {
  it('案件の題名と顧客名を付けて、発行日の新しい順に返す', async () => {
    const older = await createInvoice(alice.client, input({ issued_on: '2026-09-01' }))
    const newer = await createInvoice(alice.client, input({ issued_on: '2026-10-05' }))

    const ids = (await listInvoices(alice.client)).map((invoice) => invoice.id)
    expect(ids.indexOf(newer.id)).toBeLessThan(ids.indexOf(older.id))
    expect(newer.project).toEqual({ title: 'LP制作', customer_name: 'A社' })
  })

  it('他人の請求は含まれない', async () => {
    const invoice = await createInvoice(alice.client, input())

    const ids = (await listInvoices(bob.client)).map((i) => i.id)
    expect(ids).not.toContain(invoice.id)
  })
})

describe('入金の記録', () => {
  it('入金日を記録し、未入金に戻せる', async () => {
    const invoice = await createInvoice(alice.client, input())

    expect(await setInvoicePaidOn(alice.client, invoice.id, '2026-10-20')).toMatchObject({
      paid_on: '2026-10-20',
    })
    expect(await setInvoicePaidOn(alice.client, invoice.id, null)).toMatchObject({ paid_on: null })
  })

  it('他人の請求には記録できず、null を返す', async () => {
    const invoice = await createInvoice(alice.client, input())

    expect(await setInvoicePaidOn(bob.client, invoice.id, '2026-10-20')).toBeNull()
    expect((await getInvoice(alice.client, invoice.id))?.paid_on).toBeNull()
  })
})

describe('updateInvoice と deleteInvoice', () => {
  it('他人の請求は更新できず、null を返す', async () => {
    const invoice = await createInvoice(alice.client, input({ amount: 5000 }))

    expect(await updateInvoice(bob.client, invoice.id, input({ amount: 1 }))).toBeNull()
    expect((await getInvoice(alice.client, invoice.id))?.amount).toBe(5000)
  })

  it('本人は削除でき、他人は削除できない', async () => {
    const invoice = await createInvoice(alice.client, input())

    expect(await deleteInvoice(bob.client, invoice.id)).toBe(false)
    expect(await deleteInvoice(alice.client, invoice.id)).toBe(true)
    expect(await getInvoice(alice.client, invoice.id)).toBeNull()
  })
})
