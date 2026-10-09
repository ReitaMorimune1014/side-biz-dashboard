import { describe, expect, it } from 'vitest'
import {
  firstParam,
  listHref,
  matchesSearch,
  pageNumbers,
  paginate,
  parsePage,
  parseSearch,
  pickOption,
} from './query'

describe('firstParam', () => {
  it('値がなければ空文字、複数あれば最初の値', () => {
    expect(firstParam({}, 'q')).toBe('')
    expect(firstParam({ q: 'a' }, 'q')).toBe('a')
    expect(firstParam({ q: ['a', 'b'] }, 'q')).toBe('a')
  })
})

describe('pickOption', () => {
  it('決まった値ならそのまま、違えば既定値', () => {
    const options = ['created', 'due'] as const
    expect(pickOption('due', options, 'created')).toBe('due')
    expect(pickOption('drop table', options, 'created')).toBe('created')
    expect(pickOption('', options, 'created')).toBe('created')
  })
})

describe('parsePage', () => {
  it.each([
    ['3', 3],
    ['1', 1],
    ['', 1],
    ['0', 1],
    ['-2', 1],
    ['2.5', 1],
    ['abc', 1],
    ['9999999999', 1],
  ])('"%s" → %i', (value, expected) => {
    expect(parsePage(value)).toBe(expected)
  })
})

describe('parseSearch', () => {
  it('前後の空白を除き、100文字までにする', () => {
    expect(parseSearch('  ロゴ  ')).toBe('ロゴ')
    expect(parseSearch('あ'.repeat(150))).toHaveLength(100)
  })
})

describe('matchesSearch', () => {
  it('検索語が空なら一致する', () => {
    expect(matchesSearch(['ロゴ制作'], '')).toBe(true)
    expect(matchesSearch(['ロゴ制作'], '   ')).toBe(true)
  })

  it('どれかの項目に含まれていれば一致する', () => {
    expect(matchesSearch(['ロゴ制作', '山田商店'], '山田')).toBe(true)
    expect(matchesSearch(['ロゴ制作', '山田商店'], '佐藤')).toBe(false)
  })

  it('空白で区切った語は、すべて含まれていれば一致する(項目をまたいでよい)', () => {
    expect(matchesSearch(['ロゴ制作', '山田商店'], 'ロゴ 山田')).toBe(true)
    expect(matchesSearch(['ロゴ制作', '山田商店'], 'ロゴ 佐藤')).toBe(false)
    expect(matchesSearch(['ロゴ制作'], 'ロゴ　制作')).toBe(true)
  })

  it('全角・半角と、大文字・小文字を区別しない', () => {
    expect(matchesSearch(['Webサイト'], 'ｗｅｂ')).toBe(true)
    expect(matchesSearch(['ＬＰ制作'], 'lp')).toBe(true)
    expect(matchesSearch(['ｶﾀｶﾅ'], 'カタカナ')).toBe(true)
  })

  it('null の項目は無視する', () => {
    expect(matchesSearch(['ロゴ', null], 'ロゴ')).toBe(true)
    expect(matchesSearch([null], 'ロゴ')).toBe(false)
  })
})

describe('paginate(10件ずつ)', () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1)

  it('1ページ目は1〜10件目', () => {
    const page = paginate(items, 1)
    expect(page.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(page).toMatchObject({ page: 1, pageCount: 3, total: 23, from: 1, to: 10 })
  })

  it('最後のページは残りだけ', () => {
    const page = paginate(items, 3)
    expect(page.items).toEqual([21, 22, 23])
    expect(page).toMatchObject({ page: 3, from: 21, to: 23 })
  })

  it('範囲外のページは、最後のページに直す', () => {
    expect(paginate(items, 99).page).toBe(3)
    expect(paginate(items, 0).page).toBe(1)
  })

  it('ちょうど10件なら1ページ', () => {
    expect(paginate(items.slice(0, 10), 1).pageCount).toBe(1)
  })

  it('0件でも1ページとして返す', () => {
    expect(paginate([], 5)).toEqual({ items: [], page: 1, pageCount: 1, total: 0, from: 0, to: 0 })
  })
})

describe('pageNumbers', () => {
  it.each([
    [1, 1, [1]],
    [1, 3, [1, 2, 3]],
    [1, 5, [1, 2, 'gap', 5]],
    [3, 5, [1, 2, 3, 4, 5]],
    [5, 10, [1, 'gap', 4, 5, 6, 'gap', 10]],
    [10, 10, [1, 'gap', 9, 10]],
  ] as const)('%i / %i ページ', (page, count, expected) => {
    expect(pageNumbers(page, count)).toEqual(expected)
  })
})

describe('listHref', () => {
  it('空の値と null は URL に入れない', () => {
    expect(listHref('/projects', { q: '', status: null, page: 2 })).toBe('/projects?page=2')
    expect(listHref('/projects', { q: '' })).toBe('/projects')
  })

  it('値は URL 用にエンコードする', () => {
    expect(listHref('/projects', { q: 'ロゴ&LP' })).toBe('/projects?q=%E3%83%AD%E3%82%B4%26LP')
  })
})
