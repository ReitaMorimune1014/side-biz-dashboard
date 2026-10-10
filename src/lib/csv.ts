export type CsvCell = string | number | null

/** Excel で開いたとき、UTF-8 として読ませるための印 */
const BOM = '\uFEFF'

/**
 * 表計算ソフトが数式として実行する先頭の文字。
 * 利用者が入力した文字列(メモなど)がここで始まるときは、先頭に ' を付けて文字列として扱わせる
 * (CSV インジェクション対策)
 */
const FORMULA_PREFIX = /^[=+\-@\t\r]/

/** 1つのセル。数値はそのまま、文字列は必要なときだけ "" で囲む(RFC 4180) */
export function csvCell(value: CsvCell): string {
  if (value === null) return ''
  if (typeof value === 'number') return String(value)
  const text = FORMULA_PREFIX.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

/** 見出しと行から、CSV の文字列を作る。改行は CRLF、先頭に BOM を付ける */
export function toCsv(header: readonly string[], rows: readonly (readonly CsvCell[])[]): string {
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(','))
  return `${BOM}${lines.join('\r\n')}\r\n`
}

/**
 * ダウンロードのファイル名の指定(Content-Disposition)。
 * 日本語の名前は filename* で送り、読めないブラウザ向けに英数字の名前も付ける
 */
export function contentDisposition(fileName: string, asciiFallback: string): string {
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
}

/** CSV のダウンロードの応答。利用者ごとのデータなので、キャッシュさせない */
export function csvResponse(csv: string, fileName: string, asciiFallback: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': contentDisposition(fileName, asciiFallback),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
