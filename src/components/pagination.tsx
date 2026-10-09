import Link from "next/link";
import { pageNumbers, type Page } from "@/lib/list/query";

type Props = {
  page: Pick<Page<unknown>, "page" | "pageCount" | "total" | "from" | "to">;
  hrefFor: (page: number) => string;
  /** ページ送りの見出し(読み上げ用)。例: 「案件のページ」 */
  label: string;
};

const LINK_CLASS = "inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-zinc-300 px-3 text-sm";

export function Pagination({ page, hrefFor, label }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
      <p className="text-sm text-zinc-700" aria-live="polite">
        全{page.total}件中 {page.from}〜{page.to}件
      </p>
      {page.pageCount > 1 && (
        <nav aria-label={label}>
          <ul className="flex flex-wrap items-center gap-1">
            <li>
              {page.page > 1 ? (
                <Link href={hrefFor(page.page - 1)} className={LINK_CLASS}>
                  前へ
                </Link>
              ) : (
                <span aria-disabled="true" className={`${LINK_CLASS} text-zinc-400`}>
                  前へ
                </span>
              )}
            </li>
            {pageNumbers(page.page, page.pageCount).map((n, i) => (
              <li key={n === "gap" ? `gap-${i}` : n}>
                {n === "gap" ? (
                  <span className="px-1 text-sm text-zinc-500">…</span>
                ) : n === page.page ? (
                  <span
                    aria-current="page"
                    className={`${LINK_CLASS} border-zinc-900 bg-zinc-900 font-medium text-white`}
                  >
                    {n}
                  </span>
                ) : (
                  <Link href={hrefFor(n)} aria-label={`${n}ページ目`} className={LINK_CLASS}>
                    {n}
                  </Link>
                )}
              </li>
            ))}
            <li>
              {page.page < page.pageCount ? (
                <Link href={hrefFor(page.page + 1)} className={LINK_CLASS}>
                  次へ
                </Link>
              ) : (
                <span aria-disabled="true" className={`${LINK_CLASS} text-zinc-400`}>
                  次へ
                </span>
              )}
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
