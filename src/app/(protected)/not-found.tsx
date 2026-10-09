import { EmptyState } from "@/components/states";

export default function ProtectedNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <h1 className="text-2xl font-semibold">見つかりません</h1>
      <EmptyState
        message="お探しのデータは見つかりませんでした。削除されたか、URL が間違っている可能性があります。"
        action={{ href: "/dashboard", label: "ダッシュボードへ戻る" }}
      />
    </main>
  );
}
