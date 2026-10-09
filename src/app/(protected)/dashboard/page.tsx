import type { Metadata } from "next";
import { signOut } from "@/app/auth/actions";
import { verifySession } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "ダッシュボード",
};

export default async function DashboardPage() {
  const { email } = await verifySession();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">ダッシュボード</h1>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-zinc-400 px-4 py-2 text-sm font-medium"
          >
            ログアウト
          </button>
        </form>
      </header>
      <p className="text-zinc-700">{email} でログインしています。</p>
    </main>
  );
}
