import { describe, expect, it } from 'vitest'
import { minutesToHours, timeEntriesToCsv } from './csv'

const PROJECT_A = '11111111-1111-4111-8111-111111111111'
const PROJECT_B = '22222222-2222-4222-8222-222222222222'

const lines = (csv: string) => csv.replace(/^\uFEFF/, '').split('\r\n')

describe('minutesToHours', () => {
  it.each([
    [60, 1],
    [90, 1.5],
    [45, 0.75],
    [20, 0.33],
    [1440, 24],
  ])('%i 分は %d 時間', (minutes, hours) => {
    expect(minutesToHours(minutes)).toBe(hours)
  })
})

describe('timeEntriesToCsv', () => {
  it('見出しと、稼働ごとの行を出す。顧客名は案件から引く', () => {
    const csv = timeEntriesToCsv(
      [
        { project_id: PROJECT_A, work_date: '2026-10-09', minutes: 90, memo: 'ラフ案', project: { title: 'ロゴ制作' } },
        { project_id: PROJECT_B, work_date: '2026-10-08', minutes: 30, memo: null, project: { title: 'LP' } },
      ],
      new Map([[PROJECT_A, '山田商店']]),
    )
    expect(lines(csv)).toEqual([
      '日付,案件,顧客,分,時間,メモ',
      '2026-10-09,ロゴ制作,山田商店,90,1.5,ラフ案',
      '2026-10-08,LP,,30,0.5,',
      '',
    ])
  })
})
