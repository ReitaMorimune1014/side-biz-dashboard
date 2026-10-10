import { beforeAll, describe, expect, it } from 'vitest'
import { createCustomer } from '@/lib/customers/repository'
import { createProject } from '@/lib/projects/repository'
import {
  createTimeEntry,
  deleteTimeEntry,
  getTimeEntry,
  listTimeEntries,
  updateTimeEntry,
} from '@/lib/time-entries/repository'
import type { TimeEntryInput } from '@/lib/time-entries/schema'
import { signUpTestUser, type TestUser } from './supabase'

let alice: TestUser
let bob: TestUser
let projectId: string

const input = (overrides: Partial<TimeEntryInput> = {}): TimeEntryInput => ({
  project_id: projectId,
  work_date: '2026-10-09',
  minutes: 90,
  memo: null,
  ...overrides,
})

beforeAll(async () => {
  alice = await signUpTestUser()
  bob = await signUpTestUser()
  const customer = await createCustomer(alice.client, { name: 'A社', memo: null })
  const project = await createProject(alice.client, {
    customer_id: customer.id,
    title: 'LP制作',
    amount: 100000,
    due_date: null,
    memo: null,
  })
  projectId = project.id
})

describe('listTimeEntries', () => {
  it('案件の題名を付けて、日付の新しい順に返す', async () => {
    const user = await signUpTestUser()
    const customer = await createCustomer(user.client, { name: 'B社', memo: null })
    const project = await createProject(user.client, {
      customer_id: customer.id,
      title: '保守',
      amount: 1,
      due_date: null,
      memo: null,
    })
    for (const work_date of ['2026-10-07', '2026-10-09', '2026-10-08']) {
      await createTimeEntry(user.client, input({ project_id: project.id, work_date }))
    }

    const entries = await listTimeEntries(user.client)

    expect(entries.map((e) => e.work_date)).toEqual(['2026-10-09', '2026-10-08', '2026-10-07'])
    expect(entries[0].project).toEqual({ title: '保守' })
  })

  it('他人の稼働は含まれない', async () => {
    const entry = await createTimeEntry(alice.client, input())

    const ids = (await listTimeEntries(bob.client)).map((e) => e.id)
    expect(ids).not.toContain(entry.id)
  })
})

describe('updateTimeEntry', () => {
  it('日付・時間・メモを更新できる', async () => {
    const entry = await createTimeEntry(alice.client, input())

    const updated = await updateTimeEntry(
      alice.client,
      entry.id,
      input({ work_date: '2026-10-10', minutes: 30, memo: '修正' }),
    )

    expect(updated).toMatchObject({ work_date: '2026-10-10', minutes: 30, memo: '修正' })
  })

  it('他人の稼働は null になり、変わらない', async () => {
    const entry = await createTimeEntry(alice.client, input({ minutes: 45 }))

    expect(await updateTimeEntry(bob.client, entry.id, input({ minutes: 1 }))).toBeNull()
    expect((await getTimeEntry(alice.client, entry.id))?.minutes).toBe(45)
  })
})

describe('deleteTimeEntry', () => {
  it('本人は削除でき、削除後は見つからない', async () => {
    const entry = await createTimeEntry(alice.client, input())

    expect(await deleteTimeEntry(alice.client, entry.id)).toBe(true)
    expect(await getTimeEntry(alice.client, entry.id)).toBeNull()
    expect(await deleteTimeEntry(alice.client, entry.id)).toBe(false)
  })

  it('他人の稼働は削除できず、false を返す', async () => {
    const entry = await createTimeEntry(alice.client, input())

    expect(await deleteTimeEntry(bob.client, entry.id)).toBe(false)
    expect(await getTimeEntry(alice.client, entry.id)).not.toBeNull()
  })
})
