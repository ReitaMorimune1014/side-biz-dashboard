"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ErrorState } from "@/components/states";

export default function ProtectedError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:py-10">
      <ErrorState
        title="画面を表示できませんでした"
        message="通信が切れたか、一時的な問題が起きた可能性があります。もう一度読み込んでください。続く場合は、時間をおいてお試しください。"
      >
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex min-h-10 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white"
        >
          もう一度読み込む
        </button>
        <Link href="/dashboard" className="inline-flex min-h-10 items-center text-sm underline">
          ダッシュボードへ戻る
        </Link>
      </ErrorState>
      {error.digest && <p className="mt-3 text-xs text-zinc-500">エラーの番号: {error.digest}</p>}
    </main>
  );
}
