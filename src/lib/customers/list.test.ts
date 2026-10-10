import { describe, expect, it } from 'vitest'
import {
  applyCustomerListQuery,
  customerListParams,
  hasCustomerFilters,
  parseCustomerListQuery,
  type CustomerListQuery,
} from './list'

const DEFAULT: CustomerListQuery = { q: '', sort: 'created', page: 1 }

function customer(id: string, name: string, memo: string | null = null) {
  return { id, name, memo }
}

const ids = (page: { items: { id: string }[] }) => page.items.map((c) => c.id)

describe('parseCustomerListQuery', () => {
  it('何もなければ既定値、不正な値も既定値', () => {
    expect(parseCustomerListQuery({})).toEqual(DEFAULT)
    expect(parseCustomerListQuery({ sort: 'amount', page: '-1' })).toEqual(DEFAULT)
  })

  it('URL の値を読む', () => {
    expect(parseCustomerListQuery({ q: '山田', sort: 'name', page: '2' })).toEqual({
      q: '山田',
      sort: 'name',
      page: 2,
    })
  })
})

describe('customerListParams', () => {
  it('既定値は URL に入れない', () => {
    expect(customerListParams(DEFAULT)).toEqual({ q: '', sort: null, page: null })
    expect(customerListParams({ q: 'a', sort: 'name', page: 1 }, 2)).toEqual({
      q: 'a',
      sort: 'name',
      page: 2,
    })
  })
})

describe('hasCustomerFilters', () => {
  it('検索語があるときだけ true', () => {
    expect(hasCustomerFilters(DEFAULT)).toBe(false)
    expect(hasCustomerFilters({ ...DEFAULT, sort: 'name' })).toBe(false)
    expect(hasCustomerFilters({ ...DEFAULT, q: '山田' })).toBe(true)
  })
})

describe('applyCustomerListQuery', () => {
  it('名前とメモで検索する', () => {
    const customers = [
      customer('1', '山田商店'),
      customer('2', '佐藤工務店', '山田さんの紹介'),
      customer('3', '鈴木デザイン'),
    ]
    expect(ids(applyCustomerListQuery(customers, { ...DEFAULT, q: '山田' }))).toEqual(['1', '2'])
  })

  it('登録の新しい順は、渡された順のまま', () => {
    const customers = [customer('b', 'B'), customer('a', 'A')]
    expect(ids(applyCustomerListQuery(customers, DEFAULT))).toEqual(['b', 'a'])
  })

  it('名前順(英字は大文字・小文字を区別しない)', () => {
    const customers = [customer('c', 'charlie'), customer('a', 'Alpha'), customer('b', 'bravo')]
    expect(ids(applyCustomerListQuery(customers, { ...DEFAULT, sort: 'name' }))).toEqual([
      'a',
      'b',
      'c',
    ])
  })

  it('10件ずつに分ける', () => {
    const customers = Array.from({ length: 11 }, (_, i) => customer(String(i), `顧客${i}`))
    const page = applyCustomerListQuery(customers, { ...DEFAULT, page: 2 })
    expect(ids(page)).toEqual(['10'])
    expect(page).toMatchObject({ page: 2, pageCount: 2, total: 11 })
  })
})
