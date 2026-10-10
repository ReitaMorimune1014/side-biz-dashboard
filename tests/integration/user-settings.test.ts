import { beforeAll, describe, expect, it } from 'vitest'
import { createCustomer } from '@/lib/customers/repository'
import { createProject } from '@/lib/projects/repository'
import { getSettings, saveSettings } from '@/lib/settings/repository'
import { createTimeEntry, sumMinutesBetween } from '@/lib/time-entries/repository'
import { createAnonClient, signUpTestUser, type TestClient, type TestUser } from './supabase'

const INSUFFICIENT_PRIVILEGE = '42501'
const CHECK_VIOLATION = '23514'

let alice: TestUser
let bob: TestUser
let anon: TestClient

beforeAll(async () => {
  alice = await signUpTestUser()
  bob = await signUpTestUser()
  anon = createAnonClient()
})

describe('設定(リポジトリ)', () => {
  it('保存する前は、既定値(週5時間・月曜始まり)を返す', async () => {
    const user = await signUpTestUser()
    expect(await getSettings(user.client)).toEqual({ weekly_target_minutes: 300, week_start: 1 })
  })

  it('初回は作成し、2回目は上書きする', async () => {
    const user = await signUpTestUser()

    await saveSettings(user.client, { weekly_target_minutes: 450, week_start: 0 })
    expect(await getSettings(user.client)).toEqual({ weekly_target_minutes: 450, week_start: 0 })

    await saveSettings(user.client, { weekly_target_minutes: 600, week_start: 3 })
    expect(await getSettings(user.client)).toEqual({ weekly_target_minutes: 600, week_start: 3 })
  })
})

describe('設定のデータの分離(API を直接呼ぶ)', () => {
  it('B は A の設定を、読むことも書き換えることもできない', async () => {
    await saveSettings(alice.client, { weekly_target_minutes: 420, week_start: 1 })

    const read = await bob.client.from('user_settings').select().eq('user_id', alice.userId)
    expect(read.data).toEqual([])

    const updated = await bob.client
      .from('user_settings')
      .update({ weekly_target_minutes: 1 })
      .eq('user_id', alice.userId)
      .select()
    expect(updated.data).toEqual([])

    expect(await getSettings(alice.client)).toEqual({ weekly_target_minutes: 420, week_start: 1 })
  })

  it('B は所有者を A にした設定を作れない', async () => {
    const user = await signUpTestUser()
    const { error } = await bob.client
      .from('user_settings')
      .insert({ user_id: user.userId, weekly_target_minutes: 1 })
    expect(error).not.toBeNull()
    expect(await getSettings(user.client)).toEqual({ weekly_target_minutes: 300, week_start: 1 })
  })

  it('本人も、設定は削除できない', async () => {
    const { error } = await alice.client.from('user_settings').delete().eq('user_id', alice.userId)
    expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
  })

  it('未ログインでは読めない', async () => {
    const { error } = await anon.from('user_settings').select()
    expect(error?.code).toBe(INSUFFICIENT_PRIVILEGE)
  })

  it.each<{ weekly_target_minutes?: number; week_start?: number }>([
    { weekly_target_minutes: 0 },
    { weekly_target_minutes: 10081 },
    { week_start: 7 },
  ])('範囲外の値 %j は拒否する', async (values) => {
    const user = await signUpTestUser()
    const { error } = await user.client.from('user_settings').insert(values)
    expect(error?.code).toBe(CHECK_VIOLATION)
  })
})

describe('sumMinutesBetween(週の合計)', () => {
  it('期間の初日と最終日を含み、期間の外と他人の稼働は含まない', async () => {
    const user = await signUpTestUser()
    const customer = await createCustomer(user.client, { name: '顧客', memo: null })
    const project = await createProject(user.client, {
      customer_id: customer.id,
      title: '案件',
      amount: 1,
      due_date: null,
      memo: null,
    })
    const entry = (work_date: string, minutes: number) =>
      createTimeEntry(user.client, { project_id: project.id, work_date, minutes, memo: null })

    await entry('2026-10-04', 1000) // 前の週の日曜
    await entry('2026-10-05', 60) // 月曜(初日)
    await entry('2026-10-08', 30)
    await entry('2026-10-11', 15) // 日曜(最終日)
    await entry('2026-10-12', 1000) // 次の週の月曜

    expect(await sumMinutesBetween(user.client, '2026-10-05', '2026-10-11')).toBe(105)
    expect(await sumMinutesBetween(bob.client, '2026-10-05', '2026-10-11')).toBe(0)
  })
})
