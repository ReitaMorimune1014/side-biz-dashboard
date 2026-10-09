import { describe, expect, it } from 'vitest'
import {
  applyTimeEntryListQuery,
  hasTimeEntryFilters,
  parseTimeEntryListQuery,
  timeEntryListParams,
  type TimeEntryListQuery,
} from './list'

const PROJECT_A = '11111111-1111-4111-8111-111111111111'
const PROJECT_B = '22222222-2222-4222-8222-222222222222'

const DEFAULT: TimeEntryListQuery = { q: '', project: null, sort: 'newest', page: 1 }

function entry(id: string, project_id: string, title: string, memo: string | null = null) {
  return { id, project_id, memo, project: { title } }
}

const ids = (page: { items: { id: string }[] }) => page.items.map((e) => e.id)

describe('parseTimeEntryListQuery', () => {
  it('何もなければ既定値', () => {
    expect(parseTimeEntryListQuery({})).toEqual(DEFAULT)
  })

  it('URL の値を読む', () => {
    expect(
      parseTimeEntryListQuery({ q: '修正', project: PROJECT_A, sort: 'oldest', page: '3' }),
    ).toEqual({ q: '修正', project: PROJECT_A, sort: 'oldest', page: 3 })
  })

  it('案件の ID が UUID でなければ、絞り込まない', () => {
    expect(parseTimeEntryListQuery({ project: "1' or 1=1" }).project).toBeNull()
  })
})

describe('timeEntryListParams', () => {
  it('既定値は URL に入れない', () => {
    expect(timeEntryListParams(DEFAULT)).toEqual({ q: '', project: null, sort: null, page: null })
  })
})

describe('hasTimeEntryFilters', () => {
  it('検索語か案件があれば true', () => {
    expect(hasTimeEntryFilters(DEFAULT)).toBe(false)
    expect(hasTimeEntryFilters({ ...DEFAULT, sort: 'oldest' })).toBe(false)
    expect(hasTimeEntryFilters({ ...DEFAULT, q: 'a' })).toBe(true)
    expect(hasTimeEntryFilters({ ...DEFAULT, project: PROJECT_A })).toBe(true)
  })
})

describe('applyTimeEntryListQuery', () => {
  const entries = [
    entry('3', PROJECT_A, 'ロゴ制作', 'ラフ案'),
    entry('2', PROJECT_B, 'LP制作', 'ロゴの配置'),
    entry('1', PROJECT_A, 'ロゴ制作'),
  ]

  it('案件名とメモで検索する', () => {
    expect(ids(applyTimeEntryListQuery(entries, { ...DEFAULT, q: 'ロゴ' }))).toEqual(['3', '2', '1'])
    expect(ids(applyTimeEntryListQuery(entries, { ...DEFAULT, q: 'ラフ' }))).toEqual(['3'])
  })

  it('案件で絞り込む', () => {
    expect(ids(applyTimeEntryListQuery(entries, { ...DEFAULT, project: PROJECT_A }))).toEqual([
      '3',
      '1',
    ])
  })

  it('日付の新しい順は渡された順、古い順はその逆', () => {
    expect(ids(applyTimeEntryListQuery(entries, DEFAULT))).toEqual(['3', '2', '1'])
    expect(ids(applyTimeEntryListQuery(entries, { ...DEFAULT, sort: 'oldest' }))).toEqual([
      '1',
      '2',
      '3',
    ])
  })

  it('10件ずつに分ける', () => {
    const many = Array.from({ length: 25 }, (_, i) => entry(String(i), PROJECT_A, '案件'))
    const page = applyTimeEntryListQuery(many, { ...DEFAULT, page: 3 })
    expect(ids(page)).toEqual(['20', '21', '22', '23', '24'])
    expect(page).toMatchObject({ pageCount: 3, from: 21, to: 25 })
  })
})
