import type { Metadata } from "next";
import { EmptyState } from "@/components/states";
import { verifySession } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "閲覧専用",
};

export default async function ReadOnlyPage() {
  await verifySession();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">閲覧専用のアカウントです</h1>
      <EmptyState
        message="このアカウントでは、追加・変更・削除はできません。画面の閲覧はできます。"
        action={{ href: "/dashboard", label: "ダッシュボードへ戻る" }}
      />
    </main>
  );
}
