import { describe, expect, it } from 'vitest'
import { projectsToCsv } from './csv'

const base = {
  title: 'ロゴ制作',
  amount: 120000,
  status: 'paid' as const,
  due_date: '2026-10-20',
  earned_on: '2026-10-18',
  memo: null,
  customer: { name: '山田商店', deleted: false },
}

const lines = (csv: string) => csv.replace(/^\uFEFF/, '').split('\r\n')

describe('projectsToCsv', () => {
  it('見出しと、案件ごとの行を出す。状態は日本語、空の日付は空欄', () => {
    const csv = projectsToCsv([
      base,
      { ...base, title: 'LP', amount: 0, status: 'estimate', due_date: null, earned_on: null },
    ])
    expect(lines(csv)).toEqual([
      '顧客,題名,金額,状態,納期,売上日,メモ',
      '山田商店,ロゴ制作,120000,入金済,2026-10-20,2026-10-18,',
      '山田商店,LP,0,見積,,,',
      '',
    ])
  })

  it('削除した顧客は、そうとわかるようにする', () => {
    const csv = projectsToCsv([{ ...base, customer: { name: '旧顧客', deleted: true } }])
    expect(lines(csv)[1].startsWith('旧顧客(削除済み),')).toBe(true)
  })

  it('メモの改行・カンマ・数式は、CSV として安全に出す', () => {
    const csv = projectsToCsv([{ ...base, memo: '=1+1\n修正, 2回' }])
    expect(csv).toContain(`"'=1+1\n修正, 2回"`)
  })
})
