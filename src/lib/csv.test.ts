import { describe, expect, it } from 'vitest'
import { contentDisposition, csvCell, csvResponse, toCsv } from './csv'

describe('csvCell', () => {
  it('ふつうの文字列と数値は、そのまま', () => {
    expect(csvCell('ロゴ制作')).toBe('ロゴ制作')
    expect(csvCell(120000)).toBe('120000')
    expect(csvCell(-5)).toBe('-5')
    expect(csvCell(1.5)).toBe('1.5')
  })

  it('null は空', () => {
    expect(csvCell(null)).toBe('')
  })

  it('カンマ・改行・ダブルクォートを含むときは "" で囲み、" は2つにする', () => {
    expect(csvCell('A社, B社')).toBe('"A社, B社"')
    expect(csvCell('1行目\n2行目')).toBe('"1行目\n2行目"')
    expect(csvCell('1行目\r\n2行目')).toBe('"1行目\r\n2行目"')
    expect(csvCell('「"至急"」')).toBe('"「""至急""」"')
  })

  it.each(['=1+1', '+81 90', '-1', '@SUM(A1)', '\tTAB', '\rCR'])(
    '数式として実行される文字で始まる文字列 %j は、先頭に \' を付ける',
    (value) => {
      expect(csvCell(value).replace(/^"/, '').startsWith("'")).toBe(true)
    },
  )

  it('数式の対策と、囲みの両方が要るとき', () => {
    expect(csvCell('=HYPERLINK("http://example.com")')).toBe(`"'=HYPERLINK(""http://example.com"")"`)
  })

  it('途中にある = などは、そのまま', () => {
    expect(csvCell('a=b')).toBe('a=b')
    expect(csvCell('2026-10-10')).toBe('2026-10-10')
  })
})

describe('toCsv', () => {
  it('先頭に BOM、行は CRLF で区切り、最後も改行する', () => {
    expect(toCsv(['名前', '金額'], [['A', 100], ['B, C', null]])).toBe(
      '\uFEFF名前,金額\r\nA,100\r\n"B, C",\r\n',
    )
  })

  it('行がなくても見出しは出す', () => {
    expect(toCsv(['名前'], [])).toBe('\uFEFF名前\r\n')
  })
})

describe('contentDisposition', () => {
  it('日本語の名前は filename* に、英数字の名前は filename に入れる', () => {
    expect(contentDisposition('案件_2026-10-10.csv', 'projects_2026-10-10.csv')).toBe(
      "attachment; filename=\"projects_2026-10-10.csv\"; filename*=UTF-8''%E6%A1%88%E4%BB%B6_2026-10-10.csv",
    )
  })
})

describe('csvResponse', () => {
  it('CSV として返し、キャッシュさせない', async () => {
    const response = csvResponse('\uFEFFa\r\n', '案件.csv', 'projects.csv')
    expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(response.headers.get('Content-Disposition')).toContain('attachment;')
    const bytes = new Uint8Array(await response.arrayBuffer())
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
  })
})
