import Link from "next/link";
import type { ReactNode } from "react";

type Action = { href: string; label: string };

/** 一覧などが空のとき。次にすることがあれば、そのリンクを1つ出す */
export function EmptyState({ message, action }: { message: string; action?: Action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-zinc-400 px-4 py-8 text-center">
      <p className="text-zinc-700">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-flex min-h-10 items-center rounded-md border border-zinc-400 bg-white px-4 text-sm font-medium"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** 画面を表示できなかったとき。children に、やり直しなどのボタンを置く */
export function ErrorState({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: ReactNode;
}) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-semibold text-red-900">{title}</h2>
      <p className="text-sm text-red-900">{message}</p>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}

/** 読み込み中。見出しと行の形だけを出し、読み上げでは「読み込み中」と伝える */
export function LoadingState() {
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">読み込み中…</span>
      <div aria-hidden="true" className="flex animate-pulse flex-col gap-6">
        <div className="h-8 w-40 rounded bg-zinc-200" />
        <div className="h-24 rounded-md bg-zinc-100" />
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-md bg-zinc-100" />
          ))}
        </div>
      </div>
    </div>
  );
}