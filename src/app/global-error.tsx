"use client";

import "./globals.css";

/** ルートのレイアウトで起きたエラー。レイアウトの代わりに表示するので、html と body を自分で持つ */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="ja">
      <body className="flex min-h-full flex-col">
        <title>エラー | 副業管理ダッシュボード</title>
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-4 py-10">
          <div role="alert" className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-semibold text-red-900">画面を表示できませんでした</h1>
            <p className="text-sm text-red-900">
              一時的な問題が起きた可能性があります。もう一度読み込んでください。
            </p>
            <div>
              <button
                type="button"
                onClick={() => retry()}
                className="inline-flex min-h-10 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white"
              >
                もう一度読み込む
              </button>
            </div>
          </div>
          {error.digest && <p className="text-xs text-zinc-500">エラーの番号: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
