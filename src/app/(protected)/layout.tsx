import { verifySession } from "@/lib/auth/dal";
import { MainNav } from "./main-nav";

// 認証の確認は、layout ではなく各ページで行う(layout は画面遷移で再実行されないため)。
// ここで読むのは、閲覧専用の表示のためだけ
export default async function ProtectedLayout({ children }: LayoutProps<"/">) {
  const { readOnly } = await verifySession();

  return (
    <>
      <header className="border-b border-zinc-200">
        {readOnly && (
          <p className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-950">
            <span className="font-semibold">デモ(閲覧専用)</span>
            :ダミーのデータです。追加・変更・削除はできません
          </p>
        )}
        <MainNav />
      </header>
      {children}
    </>
  );
}
