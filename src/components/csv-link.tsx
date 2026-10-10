/**
 * 一覧の CSV のダウンロード。今の検索・絞り込み・並び順で、全ページ分を出す。
 * 出力先は Route Handler なので、next/link ではなく a を使う(先読みと画面遷移をさせない)
 */
export function CsvLink({ href, total }: { href: string; total: number }) {
  return (
    <div className="flex justify-end">
      <a
        href={href}
        download
        className="inline-flex min-h-9 items-center rounded-md border border-zinc-400 px-3 text-sm font-medium"
      >
        CSV を出力({total}件)
      </a>
    </div>
  );
}
