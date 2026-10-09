import Link from "next/link";
import { signOut } from "@/app/auth/actions";

// 認証の確認は、layout ではなく各ページで行う(layout は画面遷移で再実行されないため)
export default function ProtectedLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-zinc-200">
        <nav
          aria-label="メイン"
          className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3"
        >
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
            <li>
              {/* ログイン直後に表示されるため、先読みしない */}
              <Link href="/dashboard" prefetch={false}>
                ダッシュボード
              </Link>
            </li>
            <li>
              <Link href="/projects" prefetch={false}>
                案件
              </Link>
            </li>
            <li>
              <Link href="/invoices" prefetch={false}>
                請求
              </Link>
            </li>
            <li>
              <Link href="/time" prefetch={false}>
                稼働
              </Link>
            </li>
            <li>
              <Link href="/customers" prefetch={false}>
                顧客
              </Link>
            </li>
            <li>
              <Link href="/settings" prefetch={false}>
                設定
              </Link>
            </li>
          </ul>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-zinc-400 px-3 py-1.5 text-sm font-medium"
            >
              ログアウト
            </button>
          </form>
        </nav>
      </header>
      {children}
    </>
  );
}
