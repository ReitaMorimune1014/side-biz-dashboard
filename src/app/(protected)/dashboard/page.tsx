import type { Metadata } from "next";
import { verifySession } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "ダッシュボード",
};

export default async function DashboardPage() {
  const { email } = await verifySession();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">ダッシュボード</h1>
      <p className="text-zinc-700">{email} でログインしています。</p>
    </main>
  );
}
